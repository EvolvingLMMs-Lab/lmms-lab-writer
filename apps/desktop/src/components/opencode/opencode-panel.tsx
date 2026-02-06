"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useOpenCode } from "@/lib/opencode/use-opencode";
import type { ToolPart } from "@/lib/opencode/types";
import type { PendingEditFileSummary, Props } from "./types";
import { parseTasks, CollapsibleTasksBar } from "./tasks-display";
import { SessionList, EmptyState } from "./session-list";
import { MessageList } from "./message-list";
import { InputArea } from "./input-area";
import { OnboardingState } from "./onboarding";
import { ChevronIcon, PlusIcon } from "./icons";

const REVIEW_DEBUG = true;

function extractFilePathFromInput(input: Record<string, unknown>): string | null {
  const directKeys = [
    "filePath",
    "file_path",
    "filepath",
    "path",
    "target_file",
    "targetFile",
    "target_path",
    "targetPath",
    "filename",
    "file",
  ] as const;

  for (const key of directKeys) {
    const value = input[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      const nestedPath =
        (typeof nested.filePath === "string" && nested.filePath) ||
        (typeof nested.file_path === "string" && nested.file_path) ||
        (typeof nested.path === "string" && nested.path) ||
        null;
      if (nestedPath) return nestedPath;
    }
  }

  const args = input.args;
  if (args && typeof args === "object") {
    return extractFilePathFromInput(args as Record<string, unknown>);
  }

  return null;
}

function isLikelyFileWriteTool(
  toolName: string,
  input: Record<string, unknown>,
): boolean {
  const explicitTools = new Set([
    "write",
    "edit",
    "file_write",
    "file_edit",
    "writefile",
    "editfile",
    "multi_edit",
    "multiedit",
    "apply_patch",
    "replace",
    "modify",
    "update_file",
    "create_file",
  ]);

  if (explicitTools.has(toolName)) return true;

  const hasPath = !!extractFilePathFromInput(input);
  if (!hasPath) return false;

  // Heuristic fallback for providers that use different tool names.
  return /(write|edit|patch|replace|modify|update|create)/i.test(toolName);
}

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
  onCaptureFileContent,
  onEditCompleted,
  onReviewEdit,
  onTurnComplete,
  pendingEditCount = 0,
  pendingEditSummary = [],
  onOpenChangesReview,
  onUndoPendingEdits,
}: Props) {
  const opencode = useOpenCode({ baseUrl, directory, autoConnect });
  const [input, setInput] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<{ url: string; mime: string; filename: string }[]>([]);
  const [showSessionList, setShowSessionList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingMessageSentRef = useRef(false);
  const [panelParent] = useAutoAnimate({ duration: 200 });


  // Extract latest tasks from message history
  const latestTasks = useMemo(() => {
    // Scan messages in reverse to find the last updated task list
    for (let i = opencode.messages.length - 1; i >= 0; i--) {
      const msg = opencode.messages[i]!;
      if (msg.role !== 'assistant') continue;

      const msgParts = opencode.getPartsForMessage(msg.id);
      for (let j = msgParts.length - 1; j >= 0; j--) {
        const p = msgParts[j]!;
        if (p.type === 'tool') {
          const tp = p as ToolPart;
          const isTaskTool = ['todowrite', 'todocreate', 'todolist', 'todoread', 'todoupdate'].includes(tp.tool.toLowerCase());
          if (isTaskTool) {
            const output = (tp.state as { output?: string }).output;
            if (output) {
              try {
                const parsed = JSON.parse(output);
                const tasks = parseTasks(parsed);
                if (tasks) return tasks;
              } catch { }
            }
            if (tp.state.input) {
              const tasks = parseTasks(tp.state.input);
              if (tasks) return tasks;
            }
          }
        }
      }
    }
    return null;
  }, [opencode.messages, opencode.getPartsForMessage]);

  // Auto-scroll to bottom when messages/parts update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [opencode.messages, opencode.parts, opencode.status]);

  // Track tool states for accept/reject functionality
  const processedToolsRef = useRef<Set<string>>(new Set());
  const runningToolsRef = useRef<Map<string, string>>(new Map()); // toolId -> filePath
  const previousStatusRef = useRef<string>("idle");
  const hasCompletedFileEditRef = useRef(false);
  const turnCompleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const seenToolKindsRef = useRef<Set<string>>(new Set());

  const scheduleTurnComplete = useCallback(
    (reason: string) => {
      if (!onTurnComplete) return;

      if (turnCompleteTimeoutRef.current) {
        clearTimeout(turnCompleteTimeoutRef.current);
      }

      console.log(`[Review] Scheduling onTurnComplete (${reason}) in 800ms`);
      // Wait briefly to ensure async capture/read operations have settled.
      turnCompleteTimeoutRef.current = setTimeout(() => {
        console.log("[Review] Triggering onTurnComplete callback");
        onTurnComplete();
        hasCompletedFileEditRef.current = false;
        turnCompleteTimeoutRef.current = null;
      }, 800);
    },
    [onTurnComplete],
  );

  useEffect(() => {
    return () => {
      if (turnCompleteTimeoutRef.current) {
        clearTimeout(turnCompleteTimeoutRef.current);
        turnCompleteTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!onCaptureFileContent && !onEditCompleted) return;

    // Scan all parts for write/edit tools
    opencode.parts.forEach((partsArray) => {
      partsArray.forEach((part) => {
        if (part.type !== "tool") return;

        const toolPart = part as ToolPart;
        const toolName = toolPart.tool.toLowerCase();

        const input = toolPart.state.input as Record<string, unknown>;
        const filePath = extractFilePathFromInput(input);
        const isFileTool = isLikelyFileWriteTool(toolName, input);

        const toolKey = `${toolName}:${toolPart.state.status}`;
        if (REVIEW_DEBUG && !seenToolKindsRef.current.has(toolKey)) {
          seenToolKindsRef.current.add(toolKey);
          console.log("[Review][ToolSeen]", {
            tool: toolName,
            status: toolPart.state.status,
            isFileTool,
            filePath,
            inputKeys: Object.keys(input),
          });
        }

        if (!isFileTool) return;

        const toolId = toolPart.id;
        const messageId = toolPart.messageID;

        if (!filePath) {
          console.log("[Review] File-write tool missing file path:", toolName, input);
          return;
        }

        // When tool starts running, capture the file content
        if (toolPart.state.status === "running" && !runningToolsRef.current.has(toolId)) {
          console.log("[Review] Capturing file content before edit:", filePath);
          runningToolsRef.current.set(toolId, filePath);
          onCaptureFileContent?.(toolId, filePath);
        }

        // When tool completes, trigger edit completed callback.
        // Do not require a prior "running" event because SSE updates can skip states.
        if (
          toolPart.state.status === "completed" &&
          !processedToolsRef.current.has(toolId)
        ) {
          if (!runningToolsRef.current.has(toolId)) {
            console.log(
              "[Review] Tool completed without prior running state, using fallback path:",
              filePath,
            );
          }
          console.log("[Review] Tool completed, creating pending edit:", filePath);
          processedToolsRef.current.add(toolId);
          runningToolsRef.current.delete(toolId);
          hasCompletedFileEditRef.current = true;

          // Try to get the new content from the tool output or re-read the file
          // For now, we'll read the file content in the parent component
          // since we need access to the daemon
          const afterContent = (toolPart.state as { output?: string }).output || "";
          onEditCompleted?.(toolId, filePath, afterContent, messageId);

          // Sometimes status is already idle when tool completion arrives.
          if (opencode.status.type === "idle") {
            scheduleTurnComplete("file tool completed while idle");
          }
        }
      });
    });
  }, [
    opencode.parts,
    opencode.status.type,
    onCaptureFileContent,
    onEditCompleted,
    scheduleTurnComplete,
  ]);

  // Detect when turn completes (status transitions to idle after edit activity)
  useEffect(() => {
    const prevStatus = previousStatusRef.current;
    const currentStatus = opencode.status.type;

    console.log("[Review] Status change:", prevStatus, "->", currentStatus);

    const previousWasActive =
      prevStatus === "running" || prevStatus === "busy" || prevStatus === "retry";
    if (
      previousWasActive &&
      currentStatus === "idle"
    ) {
      scheduleTurnComplete("status transitioned to idle");
    }

    previousStatusRef.current = currentStatus;
  }, [opencode.status.type, scheduleTurnComplete]);

  useEffect(() => {
    if (!REVIEW_DEBUG) return;
    console.log("[Review][PanelState]", {
      status: opencode.status.type,
      pendingEditCount,
      hasCompletedFileEdit: hasCompletedFileEditRef.current,
      processedTools: processedToolsRef.current.size,
      runningTools: runningToolsRef.current.size,
      partGroups: opencode.parts.size,
    });
  }, [opencode.status.type, pendingEditCount, opencode.parts]);

  // Handle pending message from external source
  useEffect(() => {
    const handlePendingMessage = async () => {
      if (
        !pendingMessage ||
        pendingMessageSentRef.current ||
        !opencode.connected
      ) {
        return;
      }

      // Wait for model to be selected
      if (!opencode.selectedModel && opencode.providers.length === 0) {
        return;
      }

      // If no session exists, create one first
      let sessionId = opencode.currentSessionId;
      if (!sessionId) {
        const newSession = await opencode.createSession();
        if (!newSession) {
          onPendingMessageSent?.();
          return;
        }
        sessionId = newSession.id;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Now send the message
      if (sessionId) {
        pendingMessageSentRef.current = true;
        try {
          await opencode.sendMessage(pendingMessage);
          onPendingMessageSent?.();
        } catch (error) {
          console.error("[OpenCode] Error sending pending message:", error);
        }
      }
    };

    handlePendingMessage();
  }, [
    pendingMessage,
    opencode.connected,
    opencode.selectedModel,
    opencode.providers.length,
    opencode.currentSessionId,
    opencode.createSession,
    opencode.sendMessage,
    opencode.createSession,
    opencode.selectedModel,
    opencode.providers,
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
    if (!content && attachedFiles.length === 0) return;
    const filesToSend = [...attachedFiles];
    setInput("");
    setAttachedFiles([]);
    await opencode.sendMessage(content, filesToSend.length > 0 ? filesToSend : undefined);
  }, [input, attachedFiles, opencode]);

  const handleAnswer = useCallback(async (_questionID: string, answers: string[][]) => {
    // Use the question ID from the SSE question.asked event (que_...), not the tool part ID (prt_...)
    const actualQuestionID = opencode.currentQuestion?.id;
    if (!actualQuestionID) {
      console.warn("[OpenCode] No currentQuestion available, cannot answer");
      return;
    }
    await opencode.answerQuestion(actualQuestionID, answers);
  }, [opencode]);


  const handleAbort = useCallback(async () => {
    await opencode.abort();
  }, [opencode]);

  const isWorking =
    opencode.status.type === "running" ||
    opencode.status.type === "busy" ||
    opencode.status.type === "retry";

  const pendingTotals = useMemo(() => {
    return pendingEditSummary.reduce(
      (acc, item) => {
        acc.additions += item.additions;
        acc.deletions += item.deletions;
        return acc;
      },
      { additions: 0, deletions: 0 },
    );
  }, [pendingEditSummary]);

  const visiblePendingSummary = useMemo(() => {
    return pendingEditSummary.slice(0, 4);
  }, [pendingEditSummary]);

  const getFileName = useCallback((filePath: string) => {
    const normalized = filePath.replace(/\\/g, "/");
    const parts = normalized.split("/");
    return parts[parts.length - 1] || filePath;
  }, []);

  const renderPendingSummaryRow = useCallback(
    (item: PendingEditFileSummary) => (
      <div
        key={item.filePath}
        className="grid grid-cols-[1fr_auto] gap-2 px-2 py-1 border-t border-border first:border-t-0"
      >
        <div className="min-w-0">
          <div className="truncate text-[11px] text-neutral-900 font-medium">
            {getFileName(item.filePath)}
          </div>
          <div className="truncate text-[10px] text-neutral-500 font-mono">
            {item.filePath}
          </div>
        </div>
        <div className="text-[10px] text-neutral-700 font-mono whitespace-nowrap self-center">
          +{item.additions} -{item.deletions}
        </div>
      </div>
    ),
    [getFileName],
  );

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

  if (!opencode.currentSessionId || showSessionList) {
    return (
      <div className={`flex h-full flex-col ${className}`}>
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h2 className="text-xs font-mono font-medium uppercase tracking-wider">Chats</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewSession}
              className="text-[10px] font-mono px-2 py-1 border border-border hover:border-accent transition-colors"
            >
              + New
            </button>
            {opencode.currentSessionId && (
              <button onClick={() => setShowSessionList(false)} className="text-[10px] font-mono text-muted hover:text-foreground transition-colors">Back</button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SessionList
            sessions={opencode.sessions}
            currentSessionId={opencode.currentSessionId}
            onSelect={(id) => { opencode.selectSession(id); setShowSessionList(false); }}
            onDelete={opencode.deleteSession}
            onNewSession={async () => {
              const s = await opencode.createSession();
              if (s) setShowSessionList(false);
            }}
          />
        </div>
      </div>
    )
  }

  const currentSession = opencode.sessions.find(s => s.id === opencode.currentSessionId);

  return (
    <div ref={panelParent} className={`flex h-full flex-col bg-neutral-50/50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-white px-3 py-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <button onClick={() => setShowSessionList(true)} className="flex-shrink-0 text-muted hover:text-foreground transition-colors">
            <ChevronIcon className="size-4 rotate-90" />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="text-xs font-medium truncate">
              {currentSession?.title || "New Chat"}
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-muted font-mono">
              <span className={`inline-block size-1.5 rounded-full transition-colors ${isWorking ? 'bg-accent animate-pulse' : 'bg-neutral-300'}`} />
              <span className={isWorking ? 'text-accent' : ''}>
                {opencode.status.type === 'running' ? 'writing' : opencode.status.type === 'busy' ? 'busy' : 'ready'}
              </span>
              {baseUrl && <a href={baseUrl} target="_blank" rel="noopener noreferrer" className="text-muted/60 hover:text-accent hover:underline cursor-pointer transition-colors">· {baseUrl.replace(/^https?:\/\//, '')}</a>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingEditCount > 0 && onOpenChangesReview && (
            <button
              onClick={onOpenChangesReview}
              className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors"
              title="Review all pending changes"
            >
              <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Review {pendingEditCount} changes
            </button>
          )}
          <button
            onClick={handleNewSession}
            className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
            title="New Chat"
          >
            <PlusIcon className="size-5" />
          </button>
        </div>
      </div>

      {/* Collapsible tasks bar */}
      {latestTasks && <CollapsibleTasksBar tasks={latestTasks} />}

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {opencode.messages.length === 0 ? (
              <EmptyState />
            ) : (
              <MessageList
                messages={opencode.messages}
                getPartsForMessage={opencode.getPartsForMessage}
                onFileClick={onFileClick}
                onAnswer={handleAnswer}
                onReviewEdit={onReviewEdit}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-border bg-white p-3">
            {pendingEditSummary.length > 0 && (
              <div className="mb-3 border border-border bg-neutral-50">
                <div className="flex items-center justify-between gap-2 border-b border-border px-2 py-1.5">
                  <div className="text-[10px] font-mono text-neutral-700">
                    {pendingEditSummary.length} files changed +{pendingTotals.additions} -{pendingTotals.deletions}
                  </div>
                  <div className="flex items-center gap-1">
                    {onUndoPendingEdits && (
                      <button
                        onClick={onUndoPendingEdits}
                        className="px-2 py-0.5 text-[10px] font-mono border border-border bg-white text-neutral-700 hover:text-black hover:border-black transition-colors"
                        title="Revert all pending edits"
                      >
                        Undo
                      </button>
                    )}
                    {onOpenChangesReview && (
                      <button
                        onClick={onOpenChangesReview}
                        className="px-2 py-0.5 text-[10px] font-mono border border-border bg-white text-neutral-700 hover:text-black hover:border-black transition-colors"
                        title="Open detailed review"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-28 overflow-y-auto">
                  {visiblePendingSummary.map(renderPendingSummaryRow)}
                  {pendingEditSummary.length > visiblePendingSummary.length && (
                    <div className="border-t border-border px-2 py-1 text-[10px] text-neutral-500 font-mono">
                      +{pendingEditSummary.length - visiblePendingSummary.length} more files
                    </div>
                  )}
                </div>
              </div>
            )}
            <InputArea
              input={input}
              setInput={setInput}
              attachedFiles={attachedFiles}
              setAttachedFiles={setAttachedFiles}
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
          </div>
        </div>
      </div>
    </div>
  );
});
