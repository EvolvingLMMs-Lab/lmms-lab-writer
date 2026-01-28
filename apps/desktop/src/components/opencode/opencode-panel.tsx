"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
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
}: Props) {
  const opencode = useOpenCode({ baseUrl, directory, autoConnect });
  const [input, setInput] = useState("");
  const [showSessionList, setShowSessionList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [opencode.messages, opencode.parts]);

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
    opencode.status.type === "running" || opencode.status.type === "retry";

  if (!opencode.connected) {
    return (
      <div className={`flex flex-col bg-white min-h-0 ${className}`}>
        <OnboardingState
          connecting={opencode.connecting}
          error={opencode.error}
          onConnect={handleConnect}
          daemonStatus={daemonStatus}
          onRestartOpenCode={onRestartOpenCode}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white min-h-0 ${className}`}>
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
            <svg
              className={`size-3 flex-shrink-0 transition-transform ${showSessionList ? "rotate-180" : ""}`}
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
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <MessageList
              messages={opencode.messages}
              getPartsForMessage={opencode.getPartsForMessage}
              status={opencode.status}
              onFileClick={onFileClick}
            />
            <div ref={messagesEndRef} />
          </div>

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
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted">
              {opencode.sessions.length > 0
                ? "Select a session or create a new one"
                : "No sessions yet"}
            </p>
            <button
              onClick={handleNewSession}
              className="px-4 py-2 bg-white text-black text-sm border border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              New Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

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
  const sortedSessions = [...sessions].sort(
    (a, b) => b.time.updated - a.time.updated,
  );

  if (sortedSessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted">No sessions yet</p>
          <button
            onClick={onNewSession}
            className="px-4 py-2 bg-white text-black text-sm border border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
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
        const date = new Date(session.time.updated);
        const timeStr = formatRelativeTime(date);

        return (
          <div
            key={session.id}
            className={`w-full flex items-center border-b border-border hover:bg-neutral-50 transition-colors ${
              isActive ? "bg-neutral-100" : ""
            }`}
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
              <svg
                className="size-4"
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
            </button>
          </div>
        );
      })}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white border border-border p-4 max-w-xs w-full mx-4 shadow-[4px_4px_0_0_#000]">
            <p className="text-sm mb-4">
              Delete this session? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-sm border border-border hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 text-sm bg-white text-black border border-black shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

function OnboardingState({
  connecting,
  error,
  onConnect,
  daemonStatus,
  onRestartOpenCode,
}: {
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
  daemonStatus?: OpenCodeDaemonStatus;
  onRestartOpenCode?: () => void;
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
    } catch {}
  };

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
            <svg
              className="size-6 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={1.5}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
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
                className={`size-5 flex items-center justify-center text-xs border ${
                  step.status === "complete"
                    ? "border-black bg-white"
                    : step.status === "current" || step.status === "loading"
                      ? "border-black"
                      : "border-border text-muted"
                }`}
              >
                {step.status === "complete" ? (
                  <svg
                    className="size-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : step.status === "loading" ? (
                  <Spinner className="size-3" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs ${
                  step.status === "complete"
                    ? "text-muted line-through"
                    : step.status === "current" || step.status === "loading"
                      ? "text-black"
                      : "text-muted"
                }`}
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

            <p className="text-xs text-muted">
              After installing, click below to continue.
            </p>

            {onRestartOpenCode && (
              <button
                onClick={onRestartOpenCode}
                className="w-full px-4 py-2 bg-white text-black text-sm border border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              >
                I've installed OpenCode
              </button>
            )}
          </div>
        )}

        {daemonStatus === "stopped" && onRestartOpenCode && (
          <button
            onClick={onRestartOpenCode}
            className="w-full px-4 py-2 bg-white text-black text-sm border border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
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
            className="w-full px-4 py-2 bg-white text-black text-sm border border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {connecting ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="size-4" />
                Connecting...
              </span>
            ) : (
              "Connect to OpenCode"
            )}
          </button>
        )}

        {!daemonStatus && (
          <button
            onClick={onConnect}
            disabled={connecting}
            className="w-full px-4 py-2 bg-white text-black text-sm border border-black shadow-[3px_3px_0_0_#000] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 disabled:shadow-none"
          >
            {connecting ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}

function MessageList({
  messages,
  getPartsForMessage,
  status,
  onFileClick,
}: {
  messages: Message[];
  getPartsForMessage: (messageId: string) => Part[];
  status: SessionStatus;
  onFileClick?: (path: string) => void;
}) {
  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted text-xs">
        <p>Send a message to get started</p>
      </div>
    );
  }

  const turns: { user: Message; assistant: Message[]; parts: Part[] }[] = [];
  let currentTurn: {
    user: Message;
    assistant: Message[];
    parts: Part[];
  } | null = null;

  for (const msg of messages) {
    if (msg.role === "user") {
      if (currentTurn) turns.push(currentTurn);
      currentTurn = {
        user: msg,
        assistant: [],
        parts: getPartsForMessage(msg.id),
      };
    } else if (msg.role === "assistant" && currentTurn) {
      currentTurn.assistant.push(msg);
      currentTurn.parts.push(...getPartsForMessage(msg.id));
    }
  }
  if (currentTurn) turns.push(currentTurn);

  return (
    <div className="space-y-6">
      {turns.map((turn, index) => (
        <MessageTurn
          key={turn.user.id}
          turn={turn}
          isLast={index === turns.length - 1}
          status={status}
          onFileClick={onFileClick}
        />
      ))}
    </div>
  );
}

function MessageTurn({
  turn,
  isLast,
  status,
  onFileClick,
}: {
  turn: { user: Message; assistant: Message[]; parts: Part[] };
  isLast: boolean;
  status: SessionStatus;
  onFileClick?: (path: string) => void;
}) {
  const [stepsHidden, setStepsHidden] = useState(false);

  const seenIds = new Set<string>();
  const dedupedParts = turn.parts.filter((part) => {
    if (seenIds.has(part.id)) return false;
    seenIds.add(part.id);
    return true;
  });

  const userParts = dedupedParts.filter((p) => p.messageID === turn.user.id);
  const userText = userParts.find((p) => p.type === "text") as
    | TextPart
    | undefined;

  const assistantTextParts: TextPart[] = [];
  const toolParts: ToolPart[] = [];
  const reasoningParts: ReasoningPart[] = [];

  for (const part of dedupedParts) {
    if (part.messageID === turn.user.id) continue;
    if (part.type === "text" && !(part as TextPart).synthetic) {
      assistantTextParts.push(part as TextPart);
    } else if (part.type === "tool") {
      toolParts.push(part as ToolPart);
    } else if (part.type === "reasoning") {
      reasoningParts.push(part as ReasoningPart);
    }
  }

  const lastTextPart = assistantTextParts.at(-1);
  const isWorking =
    isLast && (status.type === "running" || status.type === "retry");

  const completedToolParts = toolParts.filter(
    (p) => p.state.status === "completed",
  );
  const totalDuration = completedToolParts.reduce((acc, part) => {
    const state = part.state as {
      time?: { start?: number; end?: number };
    };
    if (state.time?.start && state.time?.end) {
      return acc + (state.time.end - state.time.start);
    }
    return acc;
  }, 0);

  const fileChanges = completedToolParts
    .filter((p) => p.tool === "edit" || p.tool === "write")
    .map((p) => {
      const info = getToolInfo(p.tool, p.state.input);
      const metadata = (p.state as { metadata?: Record<string, unknown> })
        .metadata;
      const filediff = metadata?.filediff as
        | { additions?: number; deletions?: number }
        | undefined;
      return {
        file: info.subtitle || "unknown",
        additions: filediff?.additions || 0,
        deletions: filediff?.deletions || 0,
      };
    })
    .filter((f) => f.additions > 0 || f.deletions > 0);

  const hasSteps =
    toolParts.length > 0 || reasoningParts.length > 0 || isWorking;

  return (
    <div className="space-y-3">
      <div className="bg-[#e8f5f2] border border-[#c5e4dd] px-3 py-2">
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words text-neutral-800">
          {userText?.text || ""}
        </p>
      </div>

      {hasSteps && (
        <button
          type="button"
          onClick={() => setStepsHidden(!stepsHidden)}
          className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          <svg
            className={`size-3 transition-transform ${stepsHidden ? "" : "rotate-90"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span>{stepsHidden ? "Show" : "Hide"} steps</span>
          {totalDuration > 0 && (
            <>
              <span className="text-neutral-300">·</span>
              <span>{formatDuration(totalDuration)}</span>
            </>
          )}
        </button>
      )}

      {!stepsHidden && (
        <div className="space-y-2.5">
          {isWorking && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Spinner className="size-3" />
              <span>
                {status.type === "retry"
                  ? `Retrying... (${(status as { attempt: number }).attempt})`
                  : getStatusText(toolParts)}
              </span>
            </div>
          )}

          {reasoningParts.length > 0 && (
            <ReasoningDisplay parts={reasoningParts} />
          )}

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

      {lastTextPart && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-medium text-neutral-400 mb-1.5">
            Response
          </p>
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap break-words max-w-none text-neutral-700">
            <MarkdownText text={lastTextPart.text} onFileClick={onFileClick} />
          </div>
        </div>
      )}

      {fileChanges.length > 0 && (
        <div className="space-y-1 pt-1">
          {fileChanges.map((fc, i) => (
            <FileChangeRow
              key={i}
              file={fc.file}
              additions={fc.additions}
              deletions={fc.deletions}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms >= 60000) {
    const mins = Math.floor(ms / 60000);
    return `${mins}min${mins > 1 ? "s" : ""}`;
  }
  if (ms >= 1000) {
    const secs = Math.floor(ms / 1000);
    return `${secs}s`;
  }
  return `${ms}ms`;
}

function FileChangeRow({
  file,
  additions,
  deletions,
  onFileClick,
}: {
  file: string;
  additions: number;
  deletions: number;
  onFileClick?: (path: string) => void;
}) {
  const isClickable =
    onFileClick &&
    /\.(tex|bib|cls|sty|txt|md|json|yaml|yml|toml|py|js|ts|tsx|jsx|css|scss|html|xml|sh|bash|zsh|log)$/i.test(
      file,
    );

  return (
    <div className="flex items-center justify-between text-xs border border-border px-2 py-1.5 bg-neutral-50 hover:bg-neutral-100 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <svg
          className="size-3.5 text-neutral-400 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {isClickable ? (
          <button
            onClick={() => onFileClick(file)}
            className="text-neutral-700 hover:text-black hover:underline truncate"
          >
            {file}
          </button>
        ) : (
          <span className="text-neutral-700 truncate">{file}</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
        {additions > 0 && (
          <span className="text-green-600 font-medium">+{additions}</span>
        )}
        {deletions > 0 && (
          <span className="text-red-600 font-medium">-{deletions}</span>
        )}
      </div>
    </div>
  );
}

function getStatusText(toolParts: ToolPart[]): string {
  const runningTool = toolParts.find((p) => p.state.status === "running");
  if (runningTool) {
    const info = getToolInfo(runningTool.tool, runningTool.state.input);
    return info.title + (info.subtitle ? ` - ${info.subtitle}` : "");
  }
  return "Thinking...";
}

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
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function ToolIcon({ tool }: { tool: string }) {
  const iconClass = "size-4 text-neutral-500 flex-shrink-0";

  switch (tool) {
    case "bash":
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
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    case "glob":
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      );
    case "grep":
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case "read":
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case "write":
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
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case "edit":
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
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      );
    case "list":
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
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      );
    case "todowrite":
    case "todoread":
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      );
    case "webfetch":
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
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      );
    case "task":
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
    default:
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
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      );
  }
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
  const isComplete = part.state.status === "completed";
  const isError = part.state.status === "error";
  const isRunning = part.state.status === "running";

  const isClickableFile =
    onFileClick &&
    info.subtitle &&
    /\.(tex|bib|cls|sty|txt|md|json|yaml|yml|toml|py|js|ts|tsx|jsx|css|scss|html|xml|sh|bash|zsh|log|aux|toc|lof|lot|out|fls|fdb_latexmk|synctex\.gz|pdf|png|jpg|jpeg|gif|svg)$/i.test(
      info.subtitle,
    );

  const hasExpandableContent =
    isComplete &&
    (part.tool === "bash" ||
      part.tool === "read" ||
      part.tool === "grep" ||
      part.tool === "glob");
  const output = (part.state as { output?: string }).output;

  return (
    <div
      className={`text-[11px] border border-border bg-neutral-50 hover:bg-neutral-100 transition-colors ${isError ? "border-red-200 bg-red-50 hover:bg-red-50" : ""}`}
    >
      <button
        type="button"
        onClick={() => hasExpandableContent && setExpanded(!expanded)}
        disabled={!hasExpandableContent}
        className={`w-full flex items-center gap-2 px-2 py-1.5 text-left ${hasExpandableContent ? "cursor-pointer" : "cursor-default"}`}
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
            {isClickableFile && !hasExpandableContent ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onFileClick(info.subtitle!);
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

        {isComplete && (part.tool === "edit" || part.tool === "write") && (
          <DiffStats
            metadata={
              (part.state as { metadata?: Record<string, unknown> }).metadata
            }
          />
        )}

        {hasExpandableContent && (
          <svg
            className={`size-3 text-neutral-400 transition-transform flex-shrink-0 ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        )}
      </button>

      {expanded && output && (
        <div className="border-t border-border px-2 py-2 max-h-48 overflow-auto">
          <pre className="text-[10px] text-neutral-600 whitespace-pre-wrap break-all font-mono">
            {output.length > 2000 ? output.slice(0, 2000) + "..." : output}
          </pre>
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

function ReasoningDisplay({ parts }: { parts: ReasoningPart[] }) {
  const [expanded, setExpanded] = useState(false);
  const combinedText = parts.map((p) => p.text).join("\n\n");
  const previewLength = 100;
  const needsExpand = combinedText.length > previewLength;

  return (
    <div className="text-xs border border-neutral-200 bg-neutral-50 p-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-700 w-full text-left"
      >
        <svg
          className={`size-3 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="font-medium">Thinking</span>
        {!expanded && needsExpand && (
          <span className="text-neutral-400 truncate flex-1">
            {combinedText.slice(0, previewLength)}...
          </span>
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

function DiffStats({ metadata }: { metadata?: Record<string, unknown> }) {
  const filediff = metadata?.filediff as
    | { additions?: number; deletions?: number }
    | undefined;
  if (!filediff) return null;

  const { additions = 0, deletions = 0 } = filediff;
  if (additions === 0 && deletions === 0) return null;

  return (
    <span className="text-muted">
      {additions > 0 && <span className="text-green-600">+{additions}</span>}
      {additions > 0 && deletions > 0 && " "}
      {deletions > 0 && <span className="text-red-600">-{deletions}</span>}
    </span>
  );
}

function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
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
    /\.(tex|bib|cls|sty|txt|md|json|yaml|yml|toml|py|js|ts|tsx|jsx|css|scss|html|xml|sh|bash|zsh|log|pdf|png|jpg|jpeg|gif|svg)$/i.test(
      content,
    );

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          if (match) {
            const [, lang, code] = match;
            return (
              <pre
                key={i}
                className="bg-neutral-50 border border-neutral-200 p-3 overflow-x-auto text-[11px] my-3 font-mono leading-relaxed"
              >
                <code>
                  <SyntaxHighlight code={code?.trim() || ""} lang={lang} />
                </code>
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

function SyntaxHighlight({
  code,
  lang: _lang,
}: {
  code: string;
  lang?: string;
}) {
  const keywords = new Set([
    "const",
    "let",
    "var",
    "function",
    "return",
    "if",
    "else",
    "for",
    "while",
    "class",
    "import",
    "export",
    "from",
    "default",
    "async",
    "await",
    "try",
    "catch",
    "throw",
    "new",
    "this",
    "extends",
    "implements",
    "interface",
    "type",
    "enum",
    "public",
    "private",
    "protected",
    "static",
    "readonly",
    "def",
    "elif",
    "except",
    "finally",
    "with",
    "as",
    "lambda",
    "yield",
    "None",
    "True",
    "False",
    "fn",
    "pub",
    "mut",
    "impl",
    "struct",
    "trait",
    "use",
    "mod",
    "crate",
    "where",
    "match",
    "loop",
    "break",
    "continue",
  ]);

  const builtins = new Set([
    "console",
    "window",
    "document",
    "Array",
    "Object",
    "String",
    "Number",
    "Boolean",
    "Promise",
    "Map",
    "Set",
    "null",
    "undefined",
    "true",
    "false",
    "print",
    "len",
    "range",
    "str",
    "int",
    "float",
    "list",
    "dict",
    "self",
    "Self",
    "Ok",
    "Err",
    "Some",
    "Vec",
    "Box",
    "Rc",
    "Arc",
  ]);

  const lines = code.split("\n");

  return (
    <>
      {lines.map((line, lineIdx) => (
        <span key={lineIdx}>
          {highlightLine(line, keywords, builtins)}
          {lineIdx < lines.length - 1 && "\n"}
        </span>
      ))}
    </>
  );
}

function highlightLine(
  line: string,
  keywords: Set<string>,
  builtins: Set<string>,
): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  while (remaining.length > 0) {
    const stringMatch = remaining.match(/^(["'`])(?:[^\\]|\\.)*?\1/);
    if (stringMatch) {
      tokens.push(
        <span key={key++} className="text-[#006656]">
          {stringMatch[0]}
        </span>,
      );
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }

    const commentMatch = remaining.match(/^(\/\/.*|#.*)/);
    if (commentMatch) {
      tokens.push(
        <span key={key++} className="text-neutral-400 italic">
          {commentMatch[0]}
        </span>,
      );
      remaining = remaining.slice(commentMatch[0].length);
      continue;
    }

    const numberMatch = remaining.match(/^\b\d+\.?\d*\b/);
    if (numberMatch) {
      tokens.push(
        <span key={key++} className="text-[#fb4804]">
          {numberMatch[0]}
        </span>,
      );
      remaining = remaining.slice(numberMatch[0].length);
      continue;
    }

    const wordMatch = remaining.match(/^\b[a-zA-Z_]\w*\b/);
    if (wordMatch) {
      const word = wordMatch[0];
      if (keywords.has(word)) {
        tokens.push(
          <span key={key++} className="text-neutral-500">
            {word}
          </span>,
        );
      } else if (builtins.has(word)) {
        tokens.push(
          <span key={key++} className="text-[#007b80]">
            {word}
          </span>,
        );
      } else {
        tokens.push(<span key={key++}>{word}</span>);
      }
      remaining = remaining.slice(word.length);
      continue;
    }

    tokens.push(<span key={key++}>{remaining[0]}</span>);
    remaining = remaining.slice(1);
  }

  return tokens;
}

type InputAreaProps = {
  input: string;
  setInput: (value: string) => void;
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
  onSelectModel: (
    model: { providerId: string; modelId: string } | null,
  ) => void;
};

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
}: InputAreaProps) {
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

  const selectedAgentName =
    agents.find((a) => a.id === selectedAgent)?.name || "Agent";
  const selectedModelName = (() => {
    if (!selectedModel) return "Model";
    for (const provider of providers) {
      const model = provider.models?.find(
        (m) => m.id === selectedModel.modelId,
      );
      if (model) return model.name;
    }
    return "Model";
  })();

  return (
    <div className="border-t border-border flex-shrink-0 bg-white relative z-20">
      {isWorking && (
        <div className="px-3 py-2 bg-neutral-50 border-b border-border flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="absolute size-2 bg-black/60 animate-ping rounded-full" />
            <span className="size-2 bg-black rounded-full" />
          </div>
          <span className="text-xs text-neutral-600">
            Agent is working in the background...
          </span>
        </div>
      )}
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
                <svg
                  className="size-3 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
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
                <svg
                  className="size-3 text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
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
              </div>
            </div>
          </div>
        </div>
      )}

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
              <svg
                className={`size-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>

            <div className="flex items-center gap-1">
              {isWorking ? (
                <button
                  onClick={onAbort}
                  className="p-1.5 text-neutral-600 hover:text-black transition-colors"
                  title="Stop"
                >
                  <div className="size-4 border-2 border-current flex items-center justify-center">
                    <div className="size-2 bg-current" />
                  </div>
                </button>
              ) : (
                <button
                  onClick={onSend}
                  disabled={!input.trim()}
                  className="p-1.5 text-neutral-400 hover:text-black transition-colors disabled:opacity-30 disabled:hover:text-neutral-400"
                  title="Send"
                >
                  <svg
                    className="size-4"
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
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
