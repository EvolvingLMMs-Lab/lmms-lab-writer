"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOpenCode } from "@/lib/opencode/use-opencode";
import type { ToolPart } from "@/lib/opencode/types";
import type { Props } from "./types";
import { parseTasks } from "./tasks-display";
import { TasksDisplay } from "./tasks-display";
import { SessionList, EmptyState } from "./session-list";
import { MessageList } from "./message-list";
import { InputArea } from "./input-area";
import { OnboardingState } from "./onboarding";
import { ChevronIcon, PlusIcon } from "./icons";

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
  const [attachedFiles, setAttachedFiles] = useState<{ url: string; mime: string; filename: string }[]>([]);
  const [showSessionList, setShowSessionList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingMessageSentRef = useRef(false);
  const [activeTab, setActiveTab] = useState<"chat" | "tasks">("chat");

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

  // Auto-scroll to bottom when messages/parts update (only in chat tab)
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [opencode.messages, opencode.parts, opencode.status, activeTab]);

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

  const handleAnswer = useCallback(async (answer: string) => {
    if (!answer.trim()) return;
    await opencode.sendMessage(answer);
  }, [opencode]);


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
    <div className={`flex h-full flex-col bg-neutral-50/50 ${className}`}>
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
              <span className={`inline-block size-1.5 ${isWorking ? 'bg-accent animate-pulse' : 'bg-neutral-300'}`} />
              <span>{opencode.status.type === 'running' ? 'thinking' : opencode.status.type === 'busy' ? 'busy' : 'ready'}</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleNewSession}
          className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 transition-colors"
          title="New Chat"
        >
          <PlusIcon className="size-5" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-border bg-white">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider text-center border-b-2 transition-colors ${activeTab === 'chat'
            ? 'border-accent'
            : 'border-transparent text-muted hover:text-foreground'
            }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 py-1.5 text-[10px] font-mono uppercase tracking-wider text-center border-b-2 transition-colors ${activeTab === 'tasks'
            ? 'border-accent'
            : 'border-transparent text-muted hover:text-foreground'
            }`}
        >
          Tasks {latestTasks && <span className="ml-1 text-[9px] text-muted">{latestTasks.length}</span>}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {activeTab === 'chat' ? (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {opencode.messages.length === 0 ? (
                <EmptyState onNewSession={handleNewSession} hasOtherSessions={opencode.sessions.length > 1} />
              ) : (
                <MessageList
                  messages={opencode.messages}
                  getPartsForMessage={opencode.getPartsForMessage}
                  onFileClick={onFileClick}
                  onAnswer={handleAnswer}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border bg-white p-3">
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
        ) : (
          <div className="absolute inset-0 overflow-y-auto p-3 bg-white">
            {latestTasks ? (
              <TasksDisplay tasks={latestTasks} />
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted">No tasks yet</p>
                  <p className="text-xs text-muted">Tasks will appear here when the agent creates them.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
