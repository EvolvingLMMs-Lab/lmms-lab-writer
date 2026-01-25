"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { OpenCodeClient, createOpenCodeClient } from "./client";
import type { Event, Message, Part, SessionInfo, SessionStatus } from "./types";

export type UseOpenCodeOptions = {
  baseUrl?: string;
  directory?: string;
  autoConnect?: boolean;
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

  connect: () => void;
  disconnect: () => void;
  createSession: () => Promise<SessionInfo | null>;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  abort: () => Promise<void>;
  getPartsForMessage: (messageId: string) => Part[];
  resetReconnectState: () => void;
};

const DEFAULT_BASE_URL = "http://localhost:4096";

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

  const currentSessionIdRef = useRef<string | null>(null);
  currentSessionIdRef.current = currentSessionId;

  const syncFromStoreRef = useRef<() => void>(() => {});
  syncFromStoreRef.current = () => {
    const client = clientRef.current;
    if (!client) return;

    setSessions(Array.from(client.store.sessions.values()));

    const sessionId = currentSessionIdRef.current;
    if (sessionId) {
      setMessages(client.store.messages.get(sessionId) || []);
      setStatus(client.store.status.get(sessionId) || { type: "idle" });

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
    if ("properties" in event) {
      const props = event.properties as Record<string, unknown>;
      const eventSessionId =
        props.sessionID ||
        (props.info as { sessionID?: string })?.sessionID ||
        (props.part as { sessionID?: string })?.sessionID;

      if (
        event.type === "session.updated" ||
        event.type === "session.deleted"
      ) {
        syncFromStoreRef.current();
        return;
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
      setSessions(sessionList);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  }, [connected]);

  useEffect(() => {
    if (connected) {
      loadSessions();
    }
  }, [connected, loadSessions]);

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
      return session;
    } catch (err) {
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

        for (const msg of msgs) {
          await client.getParts(sessionId, msg.id);
        }

        const updatedParts = new Map<string, Part[]>();
        for (const [key, value] of client.store.parts.entries()) {
          if (key.startsWith(`${sessionId}:`)) {
            updatedParts.set(key, value);
          }
        }
        setParts(updatedParts);
      } catch (err) {
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
        setError(
          err instanceof Error ? err.message : "Failed to delete session",
        );
      }
    },
    [connected, currentSessionId, syncFromStore],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const client = clientRef.current;
      if (!client || !connected || !currentSessionId) return;

      try {
        await client.chat(currentSessionId, content);
        setTimeout(() => syncFromStore(), 100);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
      }
    },
    [connected, currentSessionId, syncFromStore],
  );

  const abort = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !connected || !currentSessionId) return;

    try {
      await client.abort(currentSessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to abort");
    }
  }, [connected, currentSessionId]);

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
    connect,
    disconnect,
    createSession,
    selectSession,
    deleteSession,
    sendMessage,
    abort,
    getPartsForMessage,
    resetReconnectState,
  };
}
