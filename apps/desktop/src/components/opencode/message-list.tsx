"use client";

import { useState, useMemo, useEffect } from "react";
import type {
  Message,
  AssistantMessage,
  Part,
  ToolPart,
  TextPart,
  ReasoningPart,
  FilePart,
} from "@/lib/opencode/types";
import { ChevronRightIcon } from "./icons";
import { MarkdownText } from "./markdown-text";
import { ToolDisplay } from "./tool-display";
import { AskUserQuestionDisplay } from "./question-wizard";

export function MessageList({
  messages,
  getPartsForMessage,
  onFileClick,
  onAnswer,
}: {
  messages: Message[];
  getPartsForMessage: (messageId: string) => Part[];
  onFileClick?: (path: string) => void;
  onAnswer?: (questionID: string, answers: string[][]) => void;
}) {
  const turns = useMemo(() => {
    const result: { user: Message; assistantMessages: Message[]; assistantParts: Part[] }[] = [];
    let currentTurn: { user: Message; assistantMessages: Message[]; assistantParts: Part[] } | null = null;

    for (const msg of messages) {
      if (msg.role === "user") {
        if (currentTurn) result.push(currentTurn);
        currentTurn = { user: msg, assistantMessages: [], assistantParts: [] };
      } else if (msg.role === "assistant" && currentTurn) {
        currentTurn.assistantMessages.push(msg);
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
    <div className="space-y-6">
      {turns.map((turn, index) => {
        const userParts = getPartsForMessage(turn.user.id);
        const userText =
          userParts.find((p): p is TextPart => p.type === "text")?.text || "";
        const userImages = userParts.filter((p): p is FilePart => p.type === "file" && "mime" in p && typeof p.mime === "string" && p.mime.startsWith("image/"));
        const isLastTurn = index === turns.length - 1;

        const lastAssistant = turn.assistantMessages[turn.assistantMessages.length - 1];
        const endTime = lastAssistant?.role === 'assistant' ? (lastAssistant as AssistantMessage).time?.completed : undefined;

        return (
          <MessageTurn
            key={turn.user.id}
            userText={userText}
            userImages={userImages}
            assistantParts={turn.assistantParts}
            onFileClick={onFileClick}
            startTime={turn.user.time?.created}
            endTime={endTime}
            onAnswer={isLastTurn ? onAnswer : undefined}
          />
        );
      })}
    </div>
  );
}

function MessageTurn({
  userText,
  userImages,
  assistantParts,
  onFileClick,
  startTime,
  endTime,
  onAnswer,
}: {
  userText: string;
  userImages?: FilePart[];
  assistantParts: Part[];
  onFileClick?: (path: string) => void;
  startTime?: number;
  endTime?: number;
  onAnswer?: (questionID: string, answers: string[][]) => void;
}) {
  const [now, setNow] = useState(Date.now());

  // Deduplicate parts
  const dedupedParts = useMemo(() => {
    const seen = new Set<string>();
    return assistantParts.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [assistantParts]);

  // Build chronological list: all parts inline, questions separated
  const { steps, askUserQuestions } = useMemo(() => {
    const questions: ToolPart[] = [];
    const chronologicalSteps: (Part | { type: "reasoning-group"; parts: ReasoningPart[] })[] = [];
    let currentReasoningGroup: ReasoningPart[] = [];

    dedupedParts.forEach((part) => {
      if (part.type === "tool") {
        const toolPart = part as ToolPart;
        if (toolPart.tool.toLowerCase() === "question" || toolPart.tool.toLowerCase() === "askuserquestion") {
          questions.push(toolPart);
          return;
        }
      }

      if (part.type === "reasoning") {
        currentReasoningGroup.push(part as ReasoningPart);
      } else {
        if (currentReasoningGroup.length > 0) {
          chronologicalSteps.push({ type: "reasoning-group", parts: [...currentReasoningGroup] });
          currentReasoningGroup = [];
        }
        chronologicalSteps.push(part);
      }
    });

    if (currentReasoningGroup.length > 0) {
      chronologicalSteps.push({ type: "reasoning-group", parts: [...currentReasoningGroup] });
    }

    return { steps: chronologicalSteps, askUserQuestions: questions };
  }, [dedupedParts]);

  // Update timer for in-progress messages
  useEffect(() => {
    if (endTime || !startTime) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [endTime, startTime]);

  const elapsedTime = useMemo(() => {
    if (!startTime) return null;
    const end = endTime || now;
    const elapsed = Math.round((end - startTime) / 1000);
    return `${elapsed}s`;
  }, [startTime, endTime, now]);

  return (
    <div className="space-y-3">
      {/* User message */}
      <div className="border-l-4 border-accent bg-background px-4 py-3">
        {userImages && userImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {userImages.map((img) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={img.url}
                  alt="Attached"
                  className="max-h-32 max-w-[200px] object-contain rounded border border-neutral-200 hover:border-neutral-400 transition-colors cursor-zoom-in"
                />
              </a>
            ))}
          </div>
        )}
        {userText && (
          <p className="text-[13px] font-mono leading-relaxed whitespace-pre-wrap break-words text-foreground">
            {userText}
          </p>
        )}
      </div>

      {/* Elapsed time badge */}
      {elapsedTime && (
        <div className="text-[10px] text-neutral-400 font-mono">{elapsedTime}</div>
      )}

      {/* All steps rendered chronologically */}
      {steps.length > 0 && (
        <div className="space-y-1.5 pl-2 border-l border-neutral-100 ml-1">
          {steps.map((step, idx) => {
            // Reasoning Group
            if ("type" in step && step.type === "reasoning-group") {
              return <ReasoningDisplay key={`reasoning-${idx}`} parts={(step as { parts: ReasoningPart[] }).parts} />;
            }

            const p = step as Part;

            // Tool Part
            if (p.type === "tool") {
              return <ToolDisplay key={p.id} part={p as ToolPart} onFileClick={onFileClick} />;
            }

            // Text Part — rendered as markdown
            if (p.type === "text") {
              return (
                <div
                  key={p.id}
                  className="text-[13px] leading-relaxed text-neutral-700"
                >
                  <MarkdownText text={(p as TextPart).text} onFileClick={onFileClick} />
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* AskUserQuestion — interactive question UI */}
      {askUserQuestions.length > 0 && (
        <div className="space-y-3">
          {askUserQuestions.map((part) => (
            <AskUserQuestionDisplay
              key={part.id}
              part={part}
              onAnswer={onAnswer}
            />
          ))}
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
