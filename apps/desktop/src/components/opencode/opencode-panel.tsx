"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

          <InputArea
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onAbort={handleAbort}
            isWorking={isWorking}
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

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="size-6 border border-neutral-300 flex items-center justify-center text-xs flex-shrink-0 text-neutral-600">
          U
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs whitespace-pre-wrap break-words">
            {userText?.text || ""}
          </p>
        </div>
      </div>

      {(toolParts.length > 0 ||
        lastTextPart ||
        isWorking ||
        reasoningParts.length > 0) && (
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

            {reasoningParts.length > 0 && (
              <ReasoningDisplay parts={reasoningParts} />
            )}

            {toolParts.length > 0 && (
              <div className="space-y-1">
                {toolParts.map((part) => (
                  <ToolDisplay key={part.id} part={part} />
                ))}
              </div>
            )}

            {lastTextPart && (
              <div className="text-xs whitespace-pre-wrap break-words max-w-none">
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

function InputArea({
  input,
  setInput,
  onSend,
  onAbort,
  isWorking,
}: {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onAbort: () => void;
  isWorking: boolean;
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

  return (
    <div className="border-t border-border flex-shrink-0 bg-white relative z-20">
      {isExpanded && (
        <div className="px-3 pt-3 pb-2 border-b border-border bg-neutral-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted font-medium">
                Agent
              </label>
              <div className="relative">
                <select className="w-full text-xs border border-border bg-white pl-2 pr-6 py-1.5 h-8 focus:outline-none focus:border-black appearance-none rounded-none">
                  <option>Auto</option>
                  <option>Coder</option>
                  <option>Architect</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="size-3 text-muted"
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
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-muted font-medium">
                Model
              </label>
              <div className="relative">
                <select className="w-full text-xs border border-border bg-white pl-2 pr-6 py-1.5 h-8 focus:outline-none focus:border-black appearance-none rounded-none">
                  <option>Claude 3.5 Sonnet</option>
                  <option>GPT-4o</option>
                  <option>DeepSeek V3</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="size-3 text-muted"
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
        </div>
      )}

      <div className="p-3">
        <div className="relative border border-border bg-white focus-within:ring-1 focus-within:ring-black transition-all shadow-sm">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={isWorking}
            className="w-full min-h-[40px] max-h-[200px] px-3 py-2 resize-none focus:outline-none text-sm bg-transparent placeholder:text-neutral-400"
            rows={1}
          />

          <div className="flex items-center justify-between px-2 pb-2 pt-1 border-t border-transparent">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors ${
                  isExpanded ? "bg-neutral-100 text-black" : ""
                }`}
                title={isExpanded ? "Hide Options" : "Show Options"}
              >
                <svg
                  className={`size-4 transition-transform duration-200 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth={1.5}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              <button
                className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
                title="Attach File (Coming Soon)"
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
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
            </div>

            {isWorking ? (
              <button
                onClick={onAbort}
                className="flex items-center justify-center size-8 bg-white text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                title="Stop"
              >
                <div className="size-3 bg-black" />
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={!input.trim()}
                className="flex items-center justify-center size-8 bg-white text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
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
                    strokeWidth={1.5}
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
