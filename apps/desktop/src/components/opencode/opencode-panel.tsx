"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOpenCode } from "@/lib/opencode/use-opencode";
import type {
  Message,
  Part,
  ToolPart,
  TextPart,
  ReasoningPart,
  SessionStatus,
  SessionInfo,
} from "@/lib/opencode/types";
import { getToolInfo } from "@/lib/opencode/types";
import { Spinner } from "@/components/ui/spinner";

type OpenCodeDaemonStatus = "stopped" | "starting" | "running" | "unavailable";

type Props = {
  className?: string;
  baseUrl?: string;
  directory?: string;
  autoConnect?: boolean;
  daemonStatus?: OpenCodeDaemonStatus;
  onRestartOpenCode?: () => void;
  onMaxReconnectFailed?: () => void;
  onFileClick?: (path: string) => void;
  pendingMessage?: string | null;
  onPendingMessageSent?: () => void;
};

export const OpenCodePanel = memo(function OpenCodePanel({
  className = "",
  baseUrl,
  directory,
  autoConnect = false,
  daemonStatus,
  onRestartOpenCode,
  onMaxReconnectFailed,
  onFileClick,
  pendingMessage,
  onPendingMessageSent,
}: Props) {
  const opencode = useOpenCode({ baseUrl, directory, autoConnect });
  const [input, setInput] = useState("");
  const [showSessionList, setShowSessionList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingMessageSentRef = useRef(false);

  // Auto-scroll to bottom when messages/parts update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [opencode.messages, opencode.parts, opencode.status]);

  // Handle pending message from external source
  useEffect(() => {
    const sendPendingMessage = async () => {
      if (
        pendingMessage &&
        !pendingMessageSentRef.current &&
        opencode.connected &&
        opencode.currentSessionId
      ) {
        pendingMessageSentRef.current = true;
        try {
          await opencode.sendMessage(pendingMessage);
        } finally {
          onPendingMessageSent?.();
        }
      }
    };

    if (pendingMessage) {
      if (opencode.connected && !opencode.currentSessionId) {
        opencode.createSession().then(() => sendPendingMessage());
      } else {
        sendPendingMessage();
      }
    } else {
      pendingMessageSentRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- using specific opencode properties to avoid re-renders
  }, [
    pendingMessage,
    opencode.connected,
    opencode.currentSessionId,
    opencode.sendMessage,
    opencode.createSession,
    onPendingMessageSent,
  ]);

  useEffect(() => {
    if (opencode.maxReconnectFailed && onMaxReconnectFailed) {
      onMaxReconnectFailed();
    }
  }, [opencode.maxReconnectFailed, onMaxReconnectFailed]);

  const handleConnect = useCallback(() => {
    opencode.connect();
  }, [opencode]);

  const handleNewSession = useCallback(async () => {
    const session = await opencode.createSession();
    if (session) {
      await opencode.selectSession(session.id);
      setShowSessionList(false);
    }
  }, [opencode]);

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      await opencode.selectSession(sessionId);
      setShowSessionList(false);
    },
    [opencode],
  );

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    await opencode.sendMessage(content);
  }, [input, opencode]);

  const handleAbort = useCallback(async () => {
    await opencode.abort();
  }, [opencode]);

  const isWorking =
    opencode.status.type === "running" ||
    opencode.status.type === "busy" ||
    opencode.status.type === "retry";

  // Not connected - show onboarding
  if (!opencode.connected) {
    return (
      <div className={`flex flex-col bg-white min-h-0 ${className}`}>
        <OnboardingState
          connecting={opencode.connecting}
          error={opencode.error}
          onConnect={handleConnect}
          daemonStatus={daemonStatus}
          onRestartOpenCode={onRestartOpenCode}
          hasProject={!!directory}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white min-h-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="size-2 flex-shrink-0 bg-green-500"
            title="Connected"
          />
          <button
            onClick={() => setShowSessionList(!showSessionList)}
            className="flex items-center gap-1 text-xs hover:bg-neutral-100 px-1 py-0.5 transition-colors min-w-0"
          >
            <span className="truncate">
              {opencode.currentSession?.title || "Select Session"}
            </span>
            <ChevronIcon
              className={`size-3 flex-shrink-0 transition-transform ${showSessionList ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        <button
          onClick={handleNewSession}
          className="text-xs px-2 py-1 border border-border hover:bg-neutral-100 transition-colors flex-shrink-0"
          title="New Session"
        >
          + New
        </button>
      </div>

      {showSessionList ? (
        <SessionList
          sessions={opencode.sessions}
          currentSessionId={opencode.currentSessionId}
          onSelect={handleSelectSession}
          onNewSession={handleNewSession}
          onDelete={opencode.deleteSession}
        />
      ) : opencode.currentSessionId ? (
        <>
          {/* Error banner */}
          {opencode.error && (
            <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-start gap-2">
              <WarningIcon className="size-4 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{opencode.error}</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <MessageList
              messages={opencode.messages}
              getPartsForMessage={opencode.getPartsForMessage}
              onFileClick={onFileClick}
            />
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <InputArea
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onAbort={handleAbort}
            isWorking={isWorking}
            agents={opencode.agents}
            providers={opencode.providers}
            selectedAgent={opencode.selectedAgent}
            selectedModel={opencode.selectedModel}
            onSelectAgent={opencode.setSelectedAgent}
            onSelectModel={opencode.setSelectedModel}
          />
        </>
      ) : (
        <EmptyState
          onNewSession={handleNewSession}
          hasOtherSessions={opencode.sessions.length > 0}
        />
      )}
    </div>
  );
});

// ============================================================================
// Sub-components
// ============================================================================

function SessionList({
  sessions,
  currentSessionId,
  onSelect,
  onNewSession,
  onDelete,
}: {
  sessions: SessionInfo[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onNewSession: () => void;
  onDelete: (id: string) => void;
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.time.updated - a.time.updated),
    [sessions],
  );

  if (sortedSessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted">No sessions yet</p>
          <button onClick={onNewSession} className="btn-brutalist">
            Create First Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      {sortedSessions.map((session) => {
        const isActive = session.id === currentSessionId;
        const timeStr = formatRelativeTime(new Date(session.time.updated));

        return (
          <div
            key={session.id}
            className={`w-full flex items-center border-b border-border hover:bg-neutral-50 transition-colors ${isActive ? "bg-neutral-100" : ""}`}
          >
            <button
              onClick={() => onSelect(session.id)}
              className="flex-1 text-left px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">
                    {session.title || "Untitled"}
                  </p>
                  {session.summary?.files !== undefined && (
                    <p className="text-xs text-muted mt-0.5">
                      {session.summary.files} file
                      {session.summary.files !== 1 ? "s" : ""} modified
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted flex-shrink-0">
                  {timeStr}
                </span>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(session.id);
              }}
              className="px-3 py-2 text-muted hover:text-red-600 transition-colors"
              title="Delete session"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>
        );
      })}

      {deleteConfirmId && (
        <ConfirmDialog
          message="Delete this session? This cannot be undone."
          onConfirm={() => {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}

function EmptyState({
  onNewSession,
  hasOtherSessions,
}: {
  onNewSession: () => void;
  hasOtherSessions: boolean;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <p className="text-sm text-muted">
          {hasOtherSessions
            ? "Select a session or create a new one"
            : "No sessions yet"}
        </p>
        <button onClick={onNewSession} className="btn-brutalist">
          New Session
        </button>
      </div>
    </div>
  );
}

function MessageList({
  messages,
  getPartsForMessage,
  onFileClick,
}: {
  messages: Message[];
  getPartsForMessage: (messageId: string) => Part[];
  onFileClick?: (path: string) => void;
}) {
  // Group messages into turns (user + assistant responses)
  // Must be before any early returns to satisfy rules-of-hooks
  const turns = useMemo(() => {
    const result: { user: Message; assistantParts: Part[] }[] = [];
    let currentTurn: { user: Message; assistantParts: Part[] } | null = null;

    for (const msg of messages) {
      if (msg.role === "user") {
        if (currentTurn) result.push(currentTurn);
        currentTurn = { user: msg, assistantParts: [] };
      } else if (msg.role === "assistant" && currentTurn) {
        const parts = getPartsForMessage(msg.id);
        currentTurn.assistantParts.push(...parts);
      }
    }
    if (currentTurn) result.push(currentTurn);
    return result;
  }, [messages, getPartsForMessage]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted text-xs">
        <p>Send a message to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {turns.map((turn) => {
        const userParts = getPartsForMessage(turn.user.id);
        const userText =
          userParts.find((p): p is TextPart => p.type === "text")?.text || "";

        return (
          <MessageTurn
            key={turn.user.id}
            userText={userText}
            assistantParts={turn.assistantParts}
            onFileClick={onFileClick}
          />
        );
      })}
    </div>
  );
}

function MessageTurn({
  userText,
  assistantParts,
  onFileClick,
}: {
  userText: string;
  assistantParts: Part[];
  onFileClick?: (path: string) => void;
}) {
  const [showSteps, setShowSteps] = useState(true);

  // Deduplicate parts
  const dedupedParts = useMemo(() => {
    const seen = new Set<string>();
    return assistantParts.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [assistantParts]);

  // Categorize parts
  const { textParts, toolParts, reasoningParts } = useMemo(() => {
    const text: TextPart[] = [];
    const tools: ToolPart[] = [];
    const reasoning: ReasoningPart[] = [];

    for (const part of dedupedParts) {
      if (part.type === "text" && !(part as TextPart).synthetic) {
        text.push(part as TextPart);
      } else if (part.type === "tool") {
        tools.push(part as ToolPart);
      } else if (part.type === "reasoning") {
        reasoning.push(part as ReasoningPart);
      }
    }
    return { textParts: text, toolParts: tools, reasoningParts: reasoning };
  }, [dedupedParts]);

  const combinedText = textParts.map((p) => p.text).join("");
  const hasReasoningContent =
    reasoningParts.length > 0 && reasoningParts.some((p) => p.text.trim());
  const hasSteps = toolParts.length > 0 || hasReasoningContent;

  return (
    <div className="space-y-3">
      {/* User message */}
      <div className="bg-[#e8f5f2] border border-[#c5e4dd] px-3 py-2">
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words text-neutral-800">
          {userText}
        </p>
      </div>

      {/* Steps toggle */}
      {hasSteps && (
        <button
          type="button"
          onClick={() => setShowSteps(!showSteps)}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <ChevronRightIcon
            className={`size-3 transition-transform ${showSteps ? "rotate-90" : ""}`}
          />
          <span>{showSteps ? "Hide" : "Show"} steps</span>
        </button>
      )}

      {/* Steps content */}
      {showSteps && (
        <div className="space-y-2">
          {/* Reasoning - only show if has actual content */}
          {hasReasoningContent && <ReasoningDisplay parts={reasoningParts} />}

          {/* Tools */}
          {toolParts.length > 0 && (
            <div className="space-y-1.5">
              {toolParts.map((part) => (
                <ToolDisplay
                  key={part.id}
                  part={part}
                  onFileClick={onFileClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Response text */}
      {combinedText && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
            Response
          </p>
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap break-words text-neutral-700">
            <MarkdownText text={combinedText} onFileClick={onFileClick} />
          </div>
        </div>
      )}
    </div>
  );
}

function ReasoningDisplay({ parts }: { parts: ReasoningPart[] }) {
  const [expanded, setExpanded] = useState(false);
  const combinedText = parts.map((p) => p.text).join("\n\n");
  const preview = combinedText.slice(0, 100);
  const needsExpand = combinedText.length > 100;

  return (
    <div className="text-xs border border-neutral-200 bg-neutral-50 p-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-700 w-full text-left"
      >
        <ChevronRightIcon
          className={`size-3 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        <span className="font-medium">Thinking</span>
        {!expanded && needsExpand && (
          <span className="text-neutral-400 truncate flex-1">{preview}...</span>
        )}
      </button>
      {expanded && (
        <div className="mt-2 text-neutral-600 whitespace-pre-wrap">
          {combinedText}
        </div>
      )}
    </div>
  );
}

function ToolDisplay({
  part,
  onFileClick,
}: {
  part: ToolPart;
  onFileClick?: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const info = getToolInfo(part.tool, part.state.input);
  const isRunning = part.state.status === "running";
  const isError = part.state.status === "error";

  const isClickableFile =
    onFileClick &&
    info.subtitle &&
    /\.(tex|bib|cls|sty|txt|md|json|yaml|yml|py|js|ts|tsx|css|html)$/i.test(
      info.subtitle,
    );
  const output = (part.state as { output?: string }).output;
  const hasDetails = Object.keys(part.state.input).length > 0 || output;

  return (
    <div
      className={`text-[11px] border bg-neutral-50 hover:bg-neutral-100 transition-colors ${isError ? "border-red-200 bg-red-50" : "border-border"}`}
    >
      <button
        type="button"
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        {isRunning ? (
          <Spinner className="size-4 flex-shrink-0" />
        ) : (
          <ToolIcon tool={part.tool} />
        )}
        <span className="font-medium text-neutral-600 uppercase tracking-wide text-[10px]">
          {info.title}
        </span>
        {info.subtitle && (
          <>
            <span className="text-neutral-300">/</span>
            {isClickableFile ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClick!(info.subtitle!);
                }}
                className="text-neutral-700 font-medium hover:text-black hover:underline truncate cursor-pointer"
              >
                {info.subtitle}
              </span>
            ) : (
              <span className="text-neutral-700 font-medium truncate">
                {info.subtitle}
              </span>
            )}
          </>
        )}
        <div className="flex-1" />
        {hasDetails && (
          <ChevronRightIcon
            className={`size-3 text-neutral-400 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {Object.keys(part.state.input).length > 0 && (
            <div className="px-2 py-2 space-y-1">
              <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-medium">
                Input
              </div>
              {Object.entries(part.state.input).map(([key, value]) => (
                <div key={key} className="font-mono">
                  <span className="text-blue-600">{key}</span>
                  <span className="text-neutral-400">: </span>
                  <span className="text-neutral-700 whitespace-pre-wrap break-all">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {output && (
            <div className="px-2 py-2 border-t border-border">
              <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-medium mb-1">
                Output
              </div>
              <pre className="text-[10px] text-neutral-600 whitespace-pre-wrap break-all font-mono max-h-48 overflow-auto">
                {output.length > 2000 ? output.slice(0, 2000) + "..." : output}
              </pre>
            </div>
          )}
        </div>
      )}

      {isError && (
        <div className="border-t border-red-200 px-2 py-1.5">
          <p className="text-red-600">
            {(part.state as { error: string }).error}
          </p>
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 300 ? value.slice(0, 300) + "..." : value;
  }
  if (value === null || value === undefined) {
    return String(value);
  }
  const json = JSON.stringify(value, null, 2);
  return json.length > 300 ? json.slice(0, 300) + "..." : json;
}

function InputArea({
  input,
  setInput,
  onSend,
  onAbort,
  isWorking,
  agents,
  providers,
  selectedAgent,
  selectedModel,
  onSelectAgent,
  onSelectModel,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  onAbort: () => void;
  isWorking: boolean;
  agents: { id: string; name: string; description?: string }[];
  providers: {
    id: string;
    name: string;
    models: { id: string; name: string }[];
  }[];
  selectedAgent: string | null;
  selectedModel: { providerId: string; modelId: string } | null;
  onSelectAgent: (agentId: string | null) => void;
  onSelectModel: (m: { providerId: string; modelId: string } | null) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const selectedModelName = useMemo(() => {
    if (!selectedModel) return "Model";
    for (const provider of providers) {
      const model = provider.models?.find(
        (m) => m.id === selectedModel.modelId,
      );
      if (model) return model.name;
    }
    return "Model";
  }, [selectedModel, providers]);

  return (
    <div className="border-t border-border flex-shrink-0 bg-white relative z-20">
      {isExpanded && (
        <div className="px-3 pt-3 pb-2 border-b border-border bg-neutral-50">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted font-medium">
                Agent
              </label>
              <div className="relative">
                <select
                  value={selectedAgent || ""}
                  onChange={(e) => onSelectAgent(e.target.value || null)}
                  className="w-full text-xs border border-border bg-white pl-2 pr-6 py-1.5 focus:outline-none focus:border-black appearance-none"
                >
                  {!Array.isArray(agents) || agents.length === 0 ? (
                    <option value="">No agents</option>
                  ) : (
                    agents
                      .filter((agent) => agent?.id)
                      .map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))
                  )}
                </select>
                <ChevronIcon className="size-3 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted font-medium">
                Model
              </label>
              <div className="relative">
                <select
                  value={
                    selectedModel
                      ? `${selectedModel.providerId}:${selectedModel.modelId}`
                      : ""
                  }
                  onChange={(e) => {
                    const [providerId, modelId] = e.target.value.split(":");
                    if (providerId && modelId) {
                      onSelectModel({ providerId, modelId });
                    } else {
                      onSelectModel(null);
                    }
                  }}
                  className="w-full text-xs border border-border bg-white pl-2 pr-6 py-1.5 focus:outline-none focus:border-black appearance-none"
                >
                  {!Array.isArray(providers) || providers.length === 0 ? (
                    <option value="">No models</option>
                  ) : (
                    providers
                      .filter((provider) => provider?.id)
                      .flatMap((provider) =>
                        Array.isArray(provider?.models)
                          ? provider.models
                              .filter((model) => model?.id)
                              .map((model) => (
                                <option
                                  key={`${provider.id}:${model.id}`}
                                  value={`${provider.id}:${model.id}`}
                                >
                                  {model.name} ({provider.name})
                                </option>
                              ))
                          : [],
                      )
                  )}
                </select>
                <ChevronIcon className="size-3 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3">
        <div className="relative border border-border bg-white focus-within:border-black transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Ask anything... "Help me debug this issue"'
            disabled={isWorking}
            className="w-full min-h-[60px] max-h-[200px] px-3 py-2.5 resize-none focus:outline-none text-sm bg-transparent placeholder:text-neutral-400"
            rows={1}
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 transition-colors ${
                isExpanded
                  ? "text-black bg-neutral-100"
                  : "text-neutral-500 hover:text-black hover:bg-neutral-50"
              }`}
              title={isExpanded ? "Hide Options" : "Show Options"}
            >
              <ProviderIcon providerId={selectedModel?.providerId} />
              <span className="truncate max-w-[120px]">
                {selectedModelName}
              </span>
              <ChevronIcon
                className={`size-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
            </button>
            <div className="flex items-center gap-1">
              {isWorking ? (
                <button
                  onClick={onAbort}
                  className="p-1.5 text-neutral-600 hover:text-black transition-colors"
                  title="Stop"
                >
                  <StopIcon className="size-4" />
                </button>
              ) : (
                <button
                  onClick={onSend}
                  disabled={!input.trim()}
                  className="p-1.5 text-neutral-400 hover:text-black transition-colors disabled:opacity-30"
                  title="Send"
                >
                  <SendIcon className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingState({
  connecting,
  error,
  onConnect,
  daemonStatus,
  onRestartOpenCode,
  hasProject,
}: {
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
  daemonStatus?: OpenCodeDaemonStatus;
  onRestartOpenCode?: () => void;
  hasProject?: boolean;
}) {
  const [copiedNpm, setCopiedNpm] = useState(false);
  const [copiedBrew, setCopiedBrew] = useState(false);

  const copyToClipboard = async (text: string, type: "npm" | "brew") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "npm") {
        setCopiedNpm(true);
        setTimeout(() => setCopiedNpm(false), 2000);
      } else {
        setCopiedBrew(true);
        setTimeout(() => setCopiedBrew(false), 2000);
      }
    } catch {
      // Silently ignore clipboard errors
    }
  };

  if (!hasProject) {
    return (
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center max-w-xs mx-auto w-full space-y-6">
          <div className="text-center">
            <div className="size-12 mx-auto mb-3 border border-border flex items-center justify-center">
              <FolderIcon className="size-6 text-muted" />
            </div>
            <h3 className="text-sm mb-1">Open a Project</h3>
            <p className="text-xs text-muted">
              Open a LaTeX project folder to use AI features
            </p>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    {
      id: "install",
      label: "Install OpenCode",
      status:
        daemonStatus === "unavailable"
          ? "current"
          : daemonStatus
            ? "complete"
            : "pending",
    },
    {
      id: "start",
      label: "Start OpenCode",
      status:
        daemonStatus === "unavailable"
          ? "pending"
          : daemonStatus === "stopped"
            ? "current"
            : daemonStatus === "starting"
              ? "loading"
              : daemonStatus === "running"
                ? "complete"
                : "pending",
    },
    {
      id: "connect",
      label: "Connect",
      status:
        daemonStatus === "running"
          ? connecting
            ? "loading"
            : "current"
          : "pending",
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center max-w-xs mx-auto w-full space-y-6">
        <div className="text-center">
          <div className="size-12 mx-auto mb-3 border border-border flex items-center justify-center">
            <TerminalIcon className="size-6 text-muted" />
          </div>
          <h3 className="text-sm mb-1">Setup Agent Mode</h3>
          <p className="text-xs text-muted">
            Connect to OpenCode to use AI features
          </p>
        </div>

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={`size-5 flex items-center justify-center text-xs border ${step.status === "complete" ? "border-black bg-white" : step.status === "current" || step.status === "loading" ? "border-black" : "border-border text-muted"}`}
              >
                {step.status === "complete" ? (
                  <CheckIcon className="size-3" />
                ) : step.status === "loading" ? (
                  <Spinner className="size-3" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs ${step.status === "complete" ? "text-muted line-through" : step.status === "current" || step.status === "loading" ? "text-black" : "text-muted"}`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-2 border border-red-200 bg-red-50 text-xs text-red-600">
            {error}
          </div>
        )}

        {daemonStatus === "unavailable" && (
          <div className="space-y-3">
            <p className="text-xs text-muted">Choose an installation method:</p>
            <div className="space-y-2">
              <div className="border border-border p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted">npm</span>
                  <button
                    onClick={() =>
                      copyToClipboard("npm i -g opencode-ai@latest", "npm")
                    }
                    className="text-xs text-muted hover:text-black"
                  >
                    {copiedNpm ? "Copied!" : "Copy"}
                  </button>
                </div>
                <code className="text-xs block font-mono">
                  npm i -g opencode-ai@latest
                </code>
              </div>
              <div className="border border-border p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted">Homebrew</span>
                  <button
                    onClick={() =>
                      copyToClipboard("brew install sst/tap/opencode", "brew")
                    }
                    className="text-xs text-muted hover:text-black"
                  >
                    {copiedBrew ? "Copied!" : "Copy"}
                  </button>
                </div>
                <code className="text-xs block font-mono">
                  brew install sst/tap/opencode
                </code>
              </div>
            </div>
            {onRestartOpenCode && (
              <button
                onClick={onRestartOpenCode}
                className="btn-brutalist w-full"
              >
                I've installed OpenCode
              </button>
            )}
          </div>
        )}

        {daemonStatus === "stopped" && onRestartOpenCode && (
          <button onClick={onRestartOpenCode} className="btn-brutalist w-full">
            Start OpenCode
          </button>
        )}

        {daemonStatus === "starting" && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted py-2">
            <Spinner className="size-4" />
            <span>Starting OpenCode...</span>
          </div>
        )}

        {daemonStatus === "running" && (
          <button
            onClick={onConnect}
            disabled={connecting}
            className="btn-brutalist w-full disabled:opacity-50"
          >
            {connecting ? (
              <>
                <Spinner className="size-4" /> Connecting...
              </>
            ) : (
              "Connect to OpenCode"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border border-border p-4 max-w-xs w-full mx-4 shadow-[4px_4px_0_0_#000]">
        <p className="text-sm mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-border hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-brutalist text-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function MarkdownText({
  text,
  onFileClick,
}: {
  text: string;
  onFileClick?: (path: string) => void;
}) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  const isClickableFile = (content: string) =>
    onFileClick &&
    /\.(tex|bib|cls|sty|txt|md|json|yaml|yml|py|js|ts|tsx|css|html|pdf|png|jpg)$/i.test(
      content,
    );

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, , code] = match;
            return (
              <pre
                key={i}
                className="bg-neutral-50 border border-neutral-200 p-3 overflow-x-auto text-[11px] my-3 font-mono leading-relaxed"
              >
                <code>{code?.trim() || ""}</code>
              </pre>
            );
          }
        }
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={i}>
            {inlineParts.map((p, j) => {
              if (p.startsWith("`") && p.endsWith("`")) {
                const content = p.slice(1, -1);
                if (isClickableFile(content)) {
                  return (
                    <button
                      key={j}
                      onClick={() => onFileClick!(content)}
                      className="text-[#006656] font-medium font-mono text-[12px] hover:underline cursor-pointer"
                    >
                      {content}
                    </button>
                  );
                }
                return (
                  <code
                    key={j}
                    className="text-[#006656] font-medium font-mono text-[12px]"
                  >
                    {content}
                  </code>
                );
              }
              return p;
            })}
          </span>
        );
      })}
    </>
  );
}

// ============================================================================
// Icons
// ============================================================================

function ProviderIcon({ providerId }: { providerId?: string }) {
  if (!providerId) return null;

  const iconClass = "size-4 text-neutral-500";
  const lowerProvider = providerId.toLowerCase();

  if (lowerProvider.includes("anthropic") || lowerProvider.includes("claude")) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.303 3.073c-.32-.907-1.662-.907-1.982 0L12 12.573l-3.321-9.5c-.32-.907-1.662-.907-1.982 0L3.073 14.697c-.32.907.187 1.803 1.134 1.803h3.586l2.207 6.427c.32.907 1.662.907 1.982 0l2.207-6.427h3.586c.947 0 1.454-.896 1.134-1.803L17.303 3.073z" />
      </svg>
    );
  }

  if (lowerProvider.includes("openai") || lowerProvider.includes("gpt")) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681v6.722zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    );
  }

  if (lowerProvider.includes("google") || lowerProvider.includes("gemini")) {
    return (
      <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018s3.132-7.018 7-7.018c1.89 0 3.47.697 4.682 1.829l-1.974 1.978c-.517-.548-1.417-1.19-2.708-1.19-2.31 0-4.187 1.956-4.187 4.401 0 2.446 1.877 4.401 4.187 4.401 2.688 0 3.693-1.955 3.852-2.963h-3.852v-2.611h6.403c.063.35.116.697.116 1.15 0 4.027-2.687 6.041-6.519 6.041z" />
      </svg>
    );
  }

  return (
    <svg
      className={iconClass}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={1.5}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={1.5}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={1.5}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={1.5}
        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={2}
        d="M5 10l7-7m0 0l7 7m-7-7v18"
      />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <div
      className={`${className} border-2 border-current flex items-center justify-center`}
    >
      <div className="size-2 bg-current" />
    </div>
  );
}

function ToolIcon({ tool }: { tool: string }) {
  const className = "size-4 text-neutral-500 flex-shrink-0";
  switch (tool) {
    case "bash":
      return <TerminalIcon className={className} />;
    case "glob":
    case "grep":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      );
    case "read":
    case "write":
    case "edit":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    default:
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={1.5}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      );
  }
}

// ============================================================================
// Utils
// ============================================================================

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
