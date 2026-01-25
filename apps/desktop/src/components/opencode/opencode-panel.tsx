"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useOpenCode } from "@/lib/opencode/use-opencode";
import type {
  Message,
  Part,
  ToolPart,
  TextPart,
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
};

export function OpenCodePanel({
  className = "",
  baseUrl,
  directory,
  autoConnect = false,
  daemonStatus,
  onRestartOpenCode,
  onMaxReconnectFailed,
}: Props) {
  const opencode = useOpenCode({ baseUrl, directory, autoConnect });
  const [input, setInput] = useState("");
  const [showSessionList, setShowSessionList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

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
        />
      ) : opencode.currentSessionId ? (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            <MessageList
              messages={opencode.messages}
              getPartsForMessage={opencode.getPartsForMessage}
              status={opencode.status}
            />
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border p-3 flex-shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message OpenCode..."
                disabled={isWorking}
                className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 border border-border resize-none focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 text-sm"
                rows={1}
              />
              {isWorking ? (
                <button
                  onClick={handleAbort}
                  className="px-4 py-2 bg-white text-black text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="px-4 py-2 bg-white text-black text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
                >
                  Send
                </button>
              )}
            </div>
          </div>
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
              className="px-4 py-2 bg-white text-black text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              New Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionList({
  sessions,
  currentSessionId,
  onSelect,
  onNewSession,
}: {
  sessions: SessionInfo[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onNewSession: () => void;
}) {
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
            className="px-4 py-2 bg-white text-black text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`w-full text-left px-3 py-2 border-b border-border hover:bg-neutral-50 transition-colors ${
              isActive ? "bg-neutral-100" : ""
            }`}
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
        );
      })}
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
                className="w-full px-4 py-2 bg-white text-black text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                I've installed OpenCode
              </button>
            )}
          </div>
        )}

        {daemonStatus === "stopped" && onRestartOpenCode && (
          <button
            onClick={onRestartOpenCode}
            className="w-full px-4 py-2 bg-white text-black text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
            className="w-full px-4 py-2 bg-white text-black text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none"
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
            className="w-full px-4 py-2 bg-white text-black text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none"
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
}: {
  messages: Message[];
  getPartsForMessage: (messageId: string) => Part[];
  status: SessionStatus;
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
        />
      ))}
    </div>
  );
}

function MessageTurn({
  turn,
  isLast,
  status,
}: {
  turn: { user: Message; assistant: Message[]; parts: Part[] };
  isLast: boolean;
  status: SessionStatus;
}) {
  const userParts = turn.parts.filter((p) => p.messageID === turn.user.id);
  const userText = userParts.find((p) => p.type === "text") as
    | TextPart
    | undefined;

  const assistantTextParts: TextPart[] = [];
  const toolParts: ToolPart[] = [];

  for (const part of turn.parts) {
    if (part.messageID === turn.user.id) continue;
    if (part.type === "text" && !(part as TextPart).synthetic) {
      assistantTextParts.push(part as TextPart);
    } else if (part.type === "tool") {
      toolParts.push(part as ToolPart);
    }
  }

  const lastTextPart = assistantTextParts.at(-1);
  const isWorking =
    isLast && (status.type === "running" || status.type === "retry");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="size-6 border border-neutral-300 flex items-center justify-center text-xs flex-shrink-0 text-neutral-600">
          U
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm whitespace-pre-wrap break-words">
            {userText?.text || ""}
          </p>
        </div>
      </div>

      {(toolParts.length > 0 || lastTextPart || isWorking) && (
        <div className="flex gap-2">
          <div className="size-6 border border-neutral-300 bg-neutral-100 flex items-center justify-center text-xs flex-shrink-0 text-neutral-500">
            A
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            {isWorking && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <Spinner />
                <span>
                  {status.type === "retry"
                    ? `Retrying... (${(status as { attempt: number }).attempt})`
                    : getStatusText(toolParts)}
                </span>
              </div>
            )}

            {toolParts.length > 0 && (
              <div className="space-y-1">
                {toolParts.map((part) => (
                  <ToolDisplay key={part.id} part={part} />
                ))}
              </div>
            )}

            {lastTextPart && (
              <div className="text-sm whitespace-pre-wrap break-words prose prose-sm max-w-none">
                <MarkdownText text={lastTextPart.text} />
              </div>
            )}
          </div>
        </div>
      )}
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

function ToolDisplay({ part }: { part: ToolPart }) {
  const info = getToolInfo(part.tool, part.state.input);
  const isComplete = part.state.status === "completed";
  const isError = part.state.status === "error";
  const isRunning = part.state.status === "running";

  return (
    <div
      className={`text-xs border border-border p-2 ${isError ? "border-red-200 bg-red-50" : ""}`}
    >
      <div className="flex items-center gap-2">
        {isRunning && <Spinner className="size-3" />}
        {isComplete && (
          <svg
            className="size-3 text-black"
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
        )}
        {isError && (
          <svg
            className="size-3 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
        <span className="font-medium">{info.title}</span>
        {info.subtitle && (
          <span className="text-muted truncate">{info.subtitle}</span>
        )}

        {isComplete && (part.tool === "edit" || part.tool === "write") && (
          <DiffStats
            metadata={
              (part.state as { metadata?: Record<string, unknown> }).metadata
            }
          />
        )}
      </div>

      {isError && (
        <p className="mt-1 text-red-600">
          {(part.state as { error: string }).error}
        </p>
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

function MarkdownText({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);

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
                className="bg-neutral-100 p-2 overflow-x-auto text-xs my-2"
              >
                <code>{code?.trim()}</code>
              </pre>
            );
          }
        }

        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={i}>
            {inlineParts.map((p, j) => {
              if (p.startsWith("`") && p.endsWith("`")) {
                return (
                  <code key={j} className="bg-neutral-100 px-1 text-xs">
                    {p.slice(1, -1)}
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
