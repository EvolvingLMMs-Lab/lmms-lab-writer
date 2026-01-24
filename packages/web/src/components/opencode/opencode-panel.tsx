"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useOpenCode } from "@/lib/opencode/use-opencode";
import type {
  Message,
  Part,
  ToolPart,
  TextPart,
  SessionStatus,
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
};

export function OpenCodePanel({
  className = "",
  baseUrl,
  directory,
  autoConnect = false,
  daemonStatus,
  onRestartOpenCode,
}: Props) {
  const opencode = useOpenCode({ baseUrl, directory, autoConnect });
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionCreatedRef = useRef(false);
  const lastDirectoryRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [opencode.messages, opencode.parts]);

  useEffect(() => {
    if (lastDirectoryRef.current !== directory) {
      lastDirectoryRef.current = directory;
      sessionCreatedRef.current = false;
    }
  }, [directory]);

  useEffect(() => {
    if (
      opencode.connected &&
      !opencode.currentSessionId &&
      !sessionCreatedRef.current &&
      directory
    ) {
      sessionCreatedRef.current = true;
      opencode.createSession().then((session) => {
        if (session) {
          opencode.selectSession(session.id);
        }
      });
    }
  }, [opencode.connected, opencode.currentSessionId, opencode, directory]);

  const handleConnect = useCallback(() => {
    opencode.connect();
  }, [opencode]);

  const handleNewSession = useCallback(async () => {
    const session = await opencode.createSession();
    if (session) {
      await opencode.selectSession(session.id);
    }
  }, [opencode]);

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

  const folderName = directory?.split("/").pop();

  return (
    <div className={`flex flex-col bg-white min-h-0 ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 text-xs min-w-0">
          <span
            className={`size-2 flex-shrink-0 ${opencode.connected ? "bg-black" : "bg-muted"}`}
            title={opencode.connected ? "Connected" : "Disconnected"}
          />
          <span className="text-muted flex-shrink-0">OpenCode</span>
          {folderName && (
            <>
              <span className="text-muted">/</span>
              <span className="truncate text-muted" title={directory}>
                {folderName}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!opencode.connected ? (
            <button
              onClick={handleConnect}
              disabled={opencode.connecting}
              className="text-xs px-2 py-1 border border-border hover:bg-accent transition-colors disabled:opacity-50"
            >
              {opencode.connecting ? "Connecting..." : "Connect"}
            </button>
          ) : (
            <button
              onClick={handleNewSession}
              className="text-xs px-2 py-1 border border-border hover:bg-accent transition-colors"
            >
              New Session
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {!opencode.connected ? (
          <DisconnectedState
            connecting={opencode.connecting}
            error={opencode.error}
            onConnect={handleConnect}
            daemonStatus={daemonStatus}
            onRestartOpenCode={onRestartOpenCode}
          />
        ) : !opencode.currentSessionId ? (
          <NoSessionState onNewSession={handleNewSession} />
        ) : (
          <MessageList
            messages={opencode.messages}
            getPartsForMessage={opencode.getPartsForMessage}
            status={opencode.status}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {opencode.connected && opencode.currentSessionId && (
        <div className="border-t border-border p-3 flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask OpenCode..."
              disabled={isWorking}
              className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 border border-border resize-none focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 text-sm"
              rows={1}
            />
            {isWorking ? (
              <button
                onClick={handleAbort}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-black/80 transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-black/80 transition-colors disabled:opacity-50"
              >
                Send
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DisconnectedState({
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
  const statusMessages: Record<OpenCodeDaemonStatus, string> = {
    stopped: "OpenCode is not running",
    starting: "OpenCode is starting...",
    running: "OpenCode is ready",
    unavailable: "OpenCode binary not found",
  };

  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
      <div className="text-muted">
        <svg
          className="w-12 h-12 mx-auto mb-4 opacity-20"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="font-medium">Connect to OpenCode</p>
        {daemonStatus && (
          <p className="text-xs mt-2 max-w-[200px]">
            {statusMessages[daemonStatus]}
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-600 max-w-[200px]">{error}</p>}

      <div className="flex gap-2">
        {daemonStatus === "running" ? (
          <button
            onClick={onConnect}
            disabled={connecting}
            className="px-4 py-2 border border-border hover:bg-accent transition-colors text-sm disabled:opacity-50"
          >
            {connecting ? "Connecting..." : "Connect"}
          </button>
        ) : daemonStatus === "unavailable" ? (
          <div className="text-xs text-muted space-y-2">
            <p>Install OpenCode:</p>
            <code className="bg-accent px-2 py-1 block">
              go install github.com/opencode-ai/opencode@latest
            </code>
          </div>
        ) : daemonStatus === "starting" ? (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Spinner className="size-4" />
            <span>Starting OpenCode...</span>
          </div>
        ) : (
          <>
            {onRestartOpenCode && (
              <button
                onClick={onRestartOpenCode}
                className="px-4 py-2 border border-border hover:bg-accent transition-colors text-sm"
              >
                Start OpenCode
              </button>
            )}
            <button
              onClick={onConnect}
              disabled={connecting}
              className="px-4 py-2 border border-border hover:bg-accent transition-colors text-sm disabled:opacity-50"
            >
              {connecting ? "Connecting..." : "Connect"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function NoSessionState({ onNewSession }: { onNewSession: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
      <div className="text-muted">
        <svg
          className="w-12 h-12 mx-auto mb-4 opacity-20"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="font-medium">Start a Session</p>
        <p className="text-xs mt-2">
          Create a new session to start chatting with OpenCode.
        </p>
      </div>
      <button
        onClick={onNewSession}
        className="px-4 py-2 bg-black text-white text-sm hover:bg-black/80 transition-colors"
      >
        New Session
      </button>
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

  // Group messages by user message (turn)
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

  // Get assistant text and tool parts
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
      {/* User message */}
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

      {/* Assistant response */}
      {(toolParts.length > 0 || lastTextPart || isWorking) && (
        <div className="flex gap-2">
          <div className="size-6 border border-neutral-300 bg-neutral-100 flex items-center justify-center text-xs flex-shrink-0 text-neutral-500">
            A
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            {/* Status indicator */}
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

            {/* Tool calls */}
            {toolParts.length > 0 && (
              <div className="space-y-1">
                {toolParts.map((part) => (
                  <ToolDisplay key={part.id} part={part} />
                ))}
              </div>
            )}

            {/* Response text */}
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
              strokeLinecap="round"
              strokeLinejoin="round"
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
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
        <span className="font-medium">{info.title}</span>
        {info.subtitle && (
          <span className="text-muted truncate">{info.subtitle}</span>
        )}

        {/* Show diff stats for edit/write */}
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
  // Simple markdown rendering - just handle code blocks and basic formatting
  // For a production app, use a proper markdown library

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
                className="bg-accent p-2 overflow-x-auto text-xs my-2"
              >
                <code>{code?.trim()}</code>
              </pre>
            );
          }
        }

        // Handle inline code
        const inlineParts = part.split(/(`[^`]+`)/g);
        return (
          <span key={i}>
            {inlineParts.map((p, j) => {
              if (p.startsWith("`") && p.endsWith("`")) {
                return (
                  <code key={j} className="bg-accent px-1 text-xs">
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
