"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  OpenCodeClient,
  createOpenCodeClient,
  isAbortError,
} from "./client";
import type { Event, Message, Part, SessionInfo, SessionStatus, QuestionAsked } from "./types";

export type UseOpenCodeOptions = {
  baseUrl?: string;
  directory?: string;
  autoConnect?: boolean;
};

export type Agent = { id: string; name: string; description?: string };
export type Model = {
  id: string;
  name: string;
  options?: {
    max?: boolean;
    reasoning?: boolean;
  };
};
export type Provider = {
  id: string;
  name: string;
  models: Model[];
};

export type UseOpenCodeReturn = {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  maxReconnectFailed: boolean;

  sessions: SessionInfo[];
  currentSession: SessionInfo | null;
  currentSessionId: string | null;
  messages: Message[];
  parts: Map<string, Part[]>;
  status: SessionStatus;
  currentQuestion: QuestionAsked | null;

  agents: Agent[];
  providers: Provider[];
  selectedAgent: string | null;
  selectedModel: { providerId: string; modelId: string } | null;

  connect: () => void;
  disconnect: () => void;
  createSession: () => Promise<SessionInfo | null>;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string, files?: { url: string; mime: string; filename?: string }[]) => Promise<void>;
  answerQuestion: (questionID: string, answers: string[][]) => Promise<void>;
  abort: () => Promise<void>;
  getPartsForMessage: (messageId: string) => Part[];
  resetReconnectState: () => void;
  setSelectedAgent: (agentId: string | null) => void;
  setSelectedModel: (
    model: { providerId: string; modelId: string } | null,
  ) => void;
};

const DEFAULT_BASE_URL = "http://localhost:4096";
const STORAGE_KEY_AGENT = "opencode-selected-agent";
const STORAGE_KEY_MODEL = "opencode-selected-model";

// Preferred providers order (first found with models will be selected)
// Google often lacks API keys by default, so put it last
const PREFERRED_PROVIDER_ORDER = [
  "anthropic",
  "openai",
  "openrouter",
  "azure",
  "aws-bedrock",
  "google", // Put Google last since it often lacks API key
];

export function useOpenCode(
  options: UseOpenCodeOptions = {},
): UseOpenCodeReturn {
  const {
    baseUrl = DEFAULT_BASE_URL,
    directory,
    autoConnect = false,
  } = options;

  const clientRef = useRef<OpenCodeClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxReconnectFailed, setMaxReconnectFailed] = useState(false);
  const wasConnectedRef = useRef(false);

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [parts, setParts] = useState<Map<string, Part[]>>(new Map());
  const [status, setStatus] = useState<SessionStatus>({ type: "idle" });
  const [currentQuestion, setCurrentQuestion] = useState<QuestionAsked | null>(null);

  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<{
    providerId: string;
    modelId: string;
  } | null>(null);

  const currentSessionIdRef = useRef<string | null>(null);
  currentSessionIdRef.current = currentSessionId;

  const sessionErrorRetryCountRef = useRef(0);
  const maxSessionErrorRetries = 3;

  const selectedAgentRef = useRef<string | null>(null);
  selectedAgentRef.current = selectedAgent;
  const selectedModelRef = useRef<{
    providerId: string;
    modelId: string;
  } | null>(null);
  selectedModelRef.current = selectedModel;

  // Sync messages and parts only (not status) - used after sending messages
  const syncMessagesAndPartsRef = useRef<() => void>(() => {});
  syncMessagesAndPartsRef.current = () => {
    const client = clientRef.current;
    if (!client) return;

    const sessionId = currentSessionIdRef.current;
    if (sessionId) {
      const newMessages = client.store.messages.get(sessionId) || [];
      console.log("[OpenCode] syncMessagesAndParts:", {
        sessionId,
        messageCount: newMessages.length,
      });

      setMessages(newMessages);

      const sessionParts = new Map<string, Part[]>();
      for (const [key, value] of client.store.parts.entries()) {
        if (key.startsWith(`${sessionId}:`)) {
          sessionParts.set(key, value);
        }
      }
      setParts(sessionParts);
    }
  };

  const syncFromStoreRef = useRef<() => void>(() => {});
  syncFromStoreRef.current = () => {
    const client = clientRef.current;
    if (!client) return;

    setSessions(Array.from(client.store.sessions.values()));

    const sessionId = currentSessionIdRef.current;
    if (sessionId) {
      const newMessages = client.store.messages.get(sessionId) || [];
      const newStatus = client.store.status.get(sessionId) || { type: "idle" };

      console.log("[OpenCode] syncFromStore:", {
        sessionId,
        messageCount: newMessages.length,
        status: newStatus,
        storeStatus: client.store.status.get(sessionId),
      });

      setMessages(newMessages);
      setStatus(newStatus);

      const sessionParts = new Map<string, Part[]>();
      for (const [key, value] of client.store.parts.entries()) {
        if (key.startsWith(`${sessionId}:`)) {
          sessionParts.set(key, value);
        }
      }
      setParts(sessionParts);
    }
  };

  const syncFromStore = useCallback(() => {
    syncFromStoreRef.current();
  }, []);

  const handleEventRef = useRef<(event: Event) => void>(() => {});
  handleEventRef.current = (event: Event) => {
    console.log("[OpenCode] Event received:", event.type, event);

    if ("properties" in event) {
      const props = event.properties as Record<string, unknown>;
      const eventSessionId =
        props.sessionID ||
        (props.info as { sessionID?: string })?.sessionID ||
        (props.part as { sessionID?: string })?.sessionID;

      console.log("[OpenCode] Event details:", {
        type: event.type,
        eventSessionId,
        currentSessionId: currentSessionIdRef.current,
        props,
      });

      if (
        event.type === "session.updated" ||
        event.type === "session.deleted"
      ) {
        syncFromStoreRef.current();
        return;
      }

      // Handle session.status events immediately for responsive UI
      if (
        event.type === "session.status" &&
        eventSessionId === currentSessionIdRef.current
      ) {
        const statusData = props.status as SessionStatus | undefined;
        console.log(
          "[OpenCode] Status update for current session:",
          statusData,
        );
        if (statusData) {
          setStatus(statusData);
        }
      }

      // Handle question.asked events
      if (event.type === "question.asked") {
        const questionData = event.properties as QuestionAsked;
        if (questionData.sessionID === currentSessionIdRef.current) {
          console.log("[OpenCode] Question asked:", questionData);
          setCurrentQuestion(questionData);
        }
      }

      // Handle session.error events - auto-recover or show error to user
      if (event.type === "session.error") {
        const errorSessionId = event.properties.sessionID;
        if (errorSessionId === currentSessionIdRef.current) {
          const errorData = event.properties.error;
          console.log(
            "[OpenCode] Session error for current session:",
            errorData,
          );

          // Parse error message
          let errorMessage =
            errorData?.data?.message || errorData?.name || "Unknown error";

          // Check if this is a non-recoverable error (billing, credits, etc.)
          const isNonRecoverable =
            errorMessage.includes("CreditsError") ||
            errorMessage.includes("No payment method") ||
            errorMessage.includes("billing") ||
            errorMessage.includes("quota") ||
            errorMessage.includes("rate limit");

          if (isNonRecoverable) {
            // Parse nested JSON for billing errors
            try {
              const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.error?.message) {
                  errorMessage = parsed.error.message;
                }
              }
            } catch {
              // Keep original error message
            }
            const providerInfo = errorData?.data?.providerID
              ? ` (Provider: ${errorData.data.providerID})`
              : "";
            setError(`${errorMessage}${providerInfo}`);
          } else {
            // Recoverable error - try to auto-recover by creating new session
            sessionErrorRetryCountRef.current++;
            console.log(
              `[OpenCode] Session error (attempt ${sessionErrorRetryCountRef.current}/${maxSessionErrorRetries}), attempting recovery...`,
            );

            if (sessionErrorRetryCountRef.current <= maxSessionErrorRetries) {
              // Clear error and create new session
              setError(null);
              const client = clientRef.current;
              if (client) {
                client
                  .createSession()
                  .then((newSession) => {
                    if (newSession) {
                      console.log(
                        "[OpenCode] Auto-recovered with new session:",
                        newSession.id,
                      );
                      setCurrentSessionId(newSession.id);
                      syncFromStoreRef.current();
                      sessionErrorRetryCountRef.current = 0;
                    }
                  })
                  .catch((err) => {
                    console.error("[OpenCode] Auto-recovery failed:", err);
                    setError("Session error. Please try again.");
                  });
              }
            } else {
              // Max retries reached
              console.error("[OpenCode] Max session error retries reached");
              setError("Session keeps failing. Please restart OpenCode.");
              sessionErrorRetryCountRef.current = 0;
            }
          }
        }
      }

      if (eventSessionId && eventSessionId === currentSessionIdRef.current) {
        syncFromStoreRef.current();
      }
    }
  };

  useEffect(() => {
    const client = createOpenCodeClient({
      baseUrl,
      directory,
      onEvent: (event) => handleEventRef.current(event),
      onConnect: () => {
        setConnected(true);
        setConnecting(false);
        setError(null);
        setMaxReconnectFailed(false);
        wasConnectedRef.current = true;
      },
      onDisconnect: () => {
        setConnected(false);
        setConnecting(false);
      },
      onError: (err) => {
        if (isAbortError(err)) {
          setConnecting(false);
          return;
        }
        setError(err.message);
        setConnecting(false);
        if (err.message.includes("Max reconnection attempts")) {
          setMaxReconnectFailed(true);
        }
      },
    });

    clientRef.current = client;

    return () => {
      client.disconnect();
      clientRef.current = null;
    };
  }, [baseUrl, directory]);

  useEffect(() => {
    if (autoConnect && !connected && !connecting) {
      setConnecting(true);
      clientRef.current?.connect();
    }
  }, [autoConnect, connected, connecting]);

  const loadSessions = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !connected) return;

    try {
      const sessionList = await client.listSessions();
      const safeSessions = Array.isArray(sessionList) ? sessionList : [];
      setSessions(safeSessions);

      if (safeSessions.length > 0 && !currentSessionIdRef.current) {
        const sorted = [...safeSessions].sort(
          (a, b) => b.time.updated - a.time.updated,
        );
        const firstSession = sorted[0];
        if (firstSession) {
          currentSessionIdRef.current = firstSession.id;
          setCurrentSessionId(firstSession.id);
          const msgs = await client.getMessages(firstSession.id);
          setMessages(msgs);
          setStatus(
            client.store.status.get(firstSession.id) || { type: "idle" },
          );

          // Parts are already included in messages
          const sessionParts = new Map<string, Part[]>();
          for (const [key, value] of client.store.parts.entries()) {
            if (key.startsWith(`${firstSession.id}:`)) {
              sessionParts.set(key, value);
            }
          }
          setParts(sessionParts);
        }
      }
    } catch (err) {
      if (isAbortError(err)) return;
      console.error("Failed to load sessions:", err);
      setSessions([]);
    }
  }, [connected]);

  const loadConfig = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !connected) return;

    try {
      const [agentList, providerList] = await Promise.all([
        client.getAgents(),
        client.getProviders(),
      ]);
      const safeAgents = Array.isArray(agentList) ? agentList : [];
      const safeProviders = Array.isArray(providerList) ? providerList : [];

      console.log("[OpenCode] Loaded config:", {
        agents: safeAgents.map((a) => ({ id: a.id, name: a.name })),
        providers: safeProviders.map((p) => ({
          id: p.id,
          name: p.name,
          modelCount: p.models?.length || 0,
        })),
      });

      setAgents(safeAgents);
      setProviders(safeProviders);

      // Load saved preferences from localStorage
      let savedAgent: string | null = null;
      let savedModel: { providerId: string; modelId: string } | null = null;
      try {
        savedAgent = localStorage.getItem(STORAGE_KEY_AGENT);
        const savedModelStr = localStorage.getItem(STORAGE_KEY_MODEL);
        if (savedModelStr) {
          savedModel = JSON.parse(savedModelStr);
        }
      } catch {
        // Ignore localStorage errors
      }

      // Agent selection: prefer saved, then first available
      if (!selectedAgentRef.current) {
        if (savedAgent && safeAgents.some((a) => a.id === savedAgent)) {
          console.log("[OpenCode] Restoring saved agent:", savedAgent);
          setSelectedAgent(savedAgent);
        } else {
          const firstAgent = safeAgents[0];
          if (firstAgent) {
            console.log("[OpenCode] Auto-selecting agent:", firstAgent.id);
            setSelectedAgent(firstAgent.id);
          }
        }
      }

      // Model selection: prefer saved, then use smart provider selection
      if (!selectedModelRef.current) {
        // Check if saved model is still valid
        if (savedModel) {
          const savedProvider = safeProviders.find(
            (p) => p.id === savedModel!.providerId,
          );
          const savedModelValid = savedProvider?.models?.some(
            (m) => m.id === savedModel!.modelId,
          );
          if (savedModelValid) {
            console.log("[OpenCode] Restoring saved model:", savedModel);
            setSelectedModel(savedModel);
            return;
          }
        }

        // Smart provider selection: prefer providers in order, skip Google by default
        let selectedProvider: Provider | undefined;
        let selectedProviderModel: { id: string; name: string } | undefined;

        for (const preferredId of PREFERRED_PROVIDER_ORDER) {
          const provider = safeProviders.find((p) =>
            p.id.toLowerCase().includes(preferredId.toLowerCase()),
          );
          if (
            provider &&
            Array.isArray(provider.models) &&
            provider.models.length > 0
          ) {
            selectedProvider = provider;
            selectedProviderModel = provider.models[0];
            break;
          }
        }

        // Fallback to first provider with models if none of the preferred ones found
        if (!selectedProvider) {
          selectedProvider = safeProviders.find(
            (p) => Array.isArray(p.models) && p.models.length > 0,
          );
          selectedProviderModel = selectedProvider?.models?.[0];
        }

        if (selectedProvider && selectedProviderModel) {
          console.log("[OpenCode] Auto-selecting model (smart selection):", {
            provider: selectedProvider.id,
            model: selectedProviderModel.id,
            reason: "preferred provider order",
          });
          setSelectedModel({
            providerId: selectedProvider.id,
            modelId: selectedProviderModel.id,
          });
        }
      }
    } catch (err) {
      if (isAbortError(err)) return;
      console.error("Failed to load config:", err);
      setAgents([]);
      setProviders([]);
    }
  }, [connected]);

  useEffect(() => {
    if (connected) {
      // Wait for API to be ready before loading data
      // EventSource may connect before REST endpoints are ready
      const client = clientRef.current;
      if (!client) return;

      let cancelled = false;
      const initData = async () => {
        // Wait for API to return JSON (with retries)
        const ready = await client.waitForApiReady();
        if (cancelled) return;

        if (ready) {
          loadSessions();
          loadConfig();
        } else {
          console.error("[OpenCode] API not ready, skipping initial data load");
        }
      };

      initData();
      return () => {
        cancelled = true;
      };
    }
  }, [connected, loadSessions, loadConfig]);

  const connect = useCallback(() => {
    const client = clientRef.current;
    if (!client || connected || connecting) return;

    setConnecting(true);
    setError(null);
    client.connect();
  }, [connected, connecting]);

  const disconnect = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;

    client.disconnect();
    setConnected(false);
  }, []);

  const createSession = useCallback(async (): Promise<SessionInfo | null> => {
    const client = clientRef.current;
    if (!client || !connected) return null;

    try {
      const session = await client.createSession();
      setCurrentSessionId(session.id);
      syncFromStore();
      sessionErrorRetryCountRef.current = 0;
      return session;
    } catch (err) {
      if (isAbortError(err)) return null;
      setError(err instanceof Error ? err.message : "Failed to create session");
      return null;
    }
  }, [connected, syncFromStore]);

  const selectSession = useCallback(
    async (sessionId: string) => {
      const client = clientRef.current;
      if (!client || !connected) return;

      currentSessionIdRef.current = sessionId;
      setCurrentSessionId(sessionId);

      try {
        const msgs = await client.getMessages(sessionId);
        setMessages(msgs);
        setStatus(client.store.status.get(sessionId) || { type: "idle" });

        const sessionParts = new Map<string, Part[]>();
        for (const [key, value] of client.store.parts.entries()) {
          if (key.startsWith(`${sessionId}:`)) {
            sessionParts.set(key, value);
          }
        }
        setParts(sessionParts);

        // Parts are already included in messages
        const updatedParts = new Map<string, Part[]>();
        for (const [key, value] of client.store.parts.entries()) {
          if (key.startsWith(`${sessionId}:`)) {
            updatedParts.set(key, value);
          }
        }
        setParts(updatedParts);

        const lastUserMessage = [...msgs]
          .reverse()
          .find((m): m is import("./types").UserMessage => m.role === "user");
        if (lastUserMessage) {
          if (lastUserMessage.agent) {
            setSelectedAgent(lastUserMessage.agent);
          }
          if (
            lastUserMessage.model?.providerID &&
            lastUserMessage.model?.modelID
          ) {
            setSelectedModel({
              providerId: lastUserMessage.model.providerID,
              modelId: lastUserMessage.model.modelID,
            });
          }
        }
      } catch (err) {
        if (isAbortError(err)) return;
        setError(err instanceof Error ? err.message : "Failed to load session");
      }
    },
    [connected],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const client = clientRef.current;
      if (!client || !connected) return;

      try {
        await client.deleteSession(sessionId);
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([]);
          setParts(new Map());
          setStatus({ type: "idle" });
        }
        syncFromStore();
      } catch (err) {
        if (isAbortError(err)) return;
        setError(
          err instanceof Error ? err.message : "Failed to delete session",
        );
      }
    },
    [connected, currentSessionId, syncFromStore],
  );

  const syncMessagesAndParts = useCallback(() => {
    syncMessagesAndPartsRef.current();
  }, []);

  const sendMessage = useCallback(
    async (content: string, files?: { url: string; mime: string; filename?: string }[]) => {
      const client = clientRef.current;
      console.log("[OpenCode] sendMessage called:", {
        hasClient: !!client,
        connected,
        currentSessionId,
        content: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        fileCount: files?.length || 0,
        selectedAgent,
        selectedModel,
        availableAgents: agents.map((a) => a.id),
        availableProviders: providers.map((p) => p.id),
      });

      if (!client || !connected || !currentSessionId) {
        console.log("[OpenCode] sendMessage aborted - preconditions not met");
        return;
      }

      // Clear previous error and set optimistic "running" status
      console.log(
        "[OpenCode] Clearing error and setting optimistic running status",
      );
      setError(null);
      setStatus({ type: "running" });

      // Use first available agent if none selected
      const agentToUse = selectedAgent || agents[0]?.id || undefined;
      console.log("[OpenCode] Agent to use:", agentToUse);

      try {
        console.log("[OpenCode] Calling client.chat with:", {
          agent: agentToUse,
          model: selectedModel,
          fileCount: files?.length || 0,
        });
        await client.chat(currentSessionId, content, {
          agent: agentToUse,
          model: selectedModel
            ? {
                providerID: selectedModel.providerId,
                modelID: selectedModel.modelId,
              }
            : undefined,
          files,
        });
        console.log("[OpenCode] client.chat completed successfully");
        // Sync messages/parts after a short delay, but NOT status
        // Status will be updated by session.status events from server
        setTimeout(() => {
          console.log(
            "[OpenCode] Running delayed syncMessagesAndParts (not status)",
          );
          syncMessagesAndParts();
        }, 500);
      } catch (err) {
        if (isAbortError(err)) {
          setStatus({ type: "idle" });
          return;
        }
        console.error("[OpenCode] sendMessage error:", err);
        // On error, reset status to idle and show error
        setStatus({ type: "idle" });
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    },
    [
      connected,
      currentSessionId,
      syncMessagesAndParts,
      selectedAgent,
      selectedModel,
      agents,
      providers,
    ],
  );

  const abort = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !connected || !currentSessionId) return;

    try {
      await client.abort(currentSessionId);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(err instanceof Error ? err.message : "Failed to abort");
    }
  }, [connected, currentSessionId]);

  const answerQuestion = useCallback(
    async (questionID: string, answers: string[][]) => {
      const client = clientRef.current;
      if (!client || !connected) {
        console.log("[OpenCode] answerQuestion: preconditions not met", {
          hasClient: !!client,
          connected,
        });
        return;
      }

      try {
        console.log("[OpenCode] Answering question:", questionID, answers);
        await client.answerQuestion(questionID, answers);
        setCurrentQuestion(null);
      } catch (err) {
        if (isAbortError(err)) return;
        console.error("[OpenCode] Failed to answer question:", err);
        setError(err instanceof Error ? err.message : "Failed to answer question");
      }
    },
    [connected],
  );

  const getPartsForMessage = useCallback(
    (messageId: string): Part[] => {
      if (!currentSessionId) return [];
      const key = `${currentSessionId}:${messageId}`;
      return parts.get(key) || [];
    },
    [currentSessionId, parts],
  );

  const resetReconnectState = useCallback(() => {
    setMaxReconnectFailed(false);
    setError(null);
    wasConnectedRef.current = false;
  }, []);

  // Wrapped setters that persist to localStorage
  const handleSetSelectedAgent = useCallback((agentId: string | null) => {
    setSelectedAgent(agentId);
    try {
      if (agentId) {
        localStorage.setItem(STORAGE_KEY_AGENT, agentId);
      } else {
        localStorage.removeItem(STORAGE_KEY_AGENT);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleSetSelectedModel = useCallback(
    (model: { providerId: string; modelId: string } | null) => {
      setSelectedModel(model);
      try {
        if (model) {
          localStorage.setItem(STORAGE_KEY_MODEL, JSON.stringify(model));
        } else {
          localStorage.removeItem(STORAGE_KEY_MODEL);
        }
      } catch {
        // Ignore localStorage errors
      }
    },
    [],
  );

  const currentSession = currentSessionId
    ? sessions.find((s) => s.id === currentSessionId) || null
    : null;

  return {
    connected,
    connecting,
    error,
    maxReconnectFailed,
    sessions,
    currentSession,
    currentSessionId,
    messages,
    parts,
    status,
    currentQuestion,
    agents,
    providers,
    selectedAgent,
    selectedModel,
    connect,
    disconnect,
    createSession,
    selectSession,
    deleteSession,
    sendMessage,
    answerQuestion,
    abort,
    getPartsForMessage,
    resetReconnectState,
    setSelectedAgent: handleSetSelectedAgent,
    setSelectedModel: handleSetSelectedModel,
  };
}
