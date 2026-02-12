"use client";

import { useCallback, useState } from "react";
import {
  type OpenCodeMessageItem,
  AI_COMMIT_DIFF_LIMIT,
  AI_COMMIT_TIMEOUT_MS,
  sleep,
  extractTextParts,
  parseOpenCodeMessageResponse,
  getPreferredOpenCodeConfig,
  sanitizeAiCommitMessage,
  buildAiCommitPrompt,
} from "./ai-commit";

interface UseAiCommitOptions {
  projectPath: string | null;
  opencodePort: number;
  stagedChanges: Array<{ path: string; staged: boolean }>;
  checkOpencodeStatus: () => Promise<{
    installed: boolean;
    running: boolean;
  } | null>;
  startOpencode: (directory: string) => Promise<unknown>;
  gitDiff: (path: string, staged: boolean) => Promise<string>;
  gitCommit: (
    message: string,
  ) => Promise<{ success: boolean; error?: string }>;
  toast: (message: string, type: "success" | "error" | "info") => void;
}

export function useAiCommit({
  projectPath,
  opencodePort,
  stagedChanges,
  checkOpencodeStatus,
  startOpencode,
  gitDiff,
  gitCommit,
  toast,
}: UseAiCommitOptions) {
  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitInput, setShowCommitInput] = useState(false);
  const [isGeneratingCommitMessageAI, setIsGeneratingCommitMessageAI] =
    useState(false);

  const runOpenCodePrompt = useCallback(
    async (prompt: string): Promise<string> => {
      if (!projectPath) {
        throw new Error("Project path is missing");
      }

      const baseUrl = `http://localhost:${opencodePort}`;
      const query = `?directory=${encodeURIComponent(projectPath)}`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-opencode-directory": encodeURIComponent(projectPath),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        AI_COMMIT_TIMEOUT_MS,
      );
      let sessionId: string | null = null;

      try {
        const createSessionResponse = await fetch(
          `${baseUrl}/session${query}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({}),
            signal: controller.signal,
          },
        );

        if (!createSessionResponse.ok) {
          const errorText = await createSessionResponse
            .text()
            .catch(() => "");
          throw new Error(
            `Failed to create OpenCode session: ${createSessionResponse.status} ${errorText}`,
          );
        }

        const sessionData = (await createSessionResponse.json()) as {
          id?: string;
        };
        if (!sessionData.id) {
          throw new Error("OpenCode session response missing id");
        }
        sessionId = sessionData.id;
        const preferred = getPreferredOpenCodeConfig();
        const requestBody: {
          parts: Array<{ type: "text"; text: string }>;
          noReply: boolean;
          agent?: string;
          model?: { providerID: string; modelID: string };
        } = {
          parts: [{ type: "text", text: prompt }],
          noReply: false,
        };
        if (preferred.agent) {
          requestBody.agent = preferred.agent;
        }
        if (preferred.model) {
          requestBody.model = preferred.model;
        }

        const messageResponse = await fetch(
          `${baseUrl}/session/${sessionId}/message${query}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          },
        );

        if (!messageResponse.ok) {
          const errorText = await messageResponse.text().catch(() => "");
          throw new Error(
            `OpenCode message failed: ${messageResponse.status} ${errorText}`,
          );
        }

        const messageDataRaw = (await messageResponse.json()) as unknown;
        const messageData = parseOpenCodeMessageResponse(messageDataRaw);
        const initialText = extractTextParts(messageData?.parts)
          .join("\n")
          .trim();
        if (initialText) {
          return initialText;
        }

        const parentMessageId =
          messageData?.info?.role === "user"
            ? messageData.info.id
            : undefined;
        const startedAt = Date.now();
        while (Date.now() - startedAt < AI_COMMIT_TIMEOUT_MS) {
          const messagesResponse = await fetch(
            `${baseUrl}/session/${sessionId}/message${query}`,
            {
              method: "GET",
              headers,
              signal: controller.signal,
            },
          );

          if (!messagesResponse.ok) {
            const errorText = await messagesResponse.text().catch(() => "");
            throw new Error(
              `Failed to poll OpenCode messages: ${messagesResponse.status} ${errorText}`,
            );
          }

          const messagesData = (await messagesResponse.json()) as unknown;
          const items = Array.isArray(messagesData)
            ? (messagesData as OpenCodeMessageItem[])
            : messagesData &&
                typeof messagesData === "object" &&
                Array.isArray(
                  (messagesData as { messages?: OpenCodeMessageItem[] })
                    .messages,
                )
              ? (
                  messagesData as {
                    messages: OpenCodeMessageItem[];
                  }
                ).messages
              : [];

          for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            const info = item?.info;
            if (!info || info.role !== "assistant") continue;
            if (
              parentMessageId &&
              info.parentID &&
              info.parentID !== parentMessageId
            ) {
              continue;
            }

            const text = extractTextParts(item.parts).join("\n").trim();
            if (text) {
              return text;
            }

            const errorMessage = info.error?.data?.message;
            if (errorMessage) {
              throw new Error(errorMessage);
            }
          }

          await sleep(500);
        }

        throw new Error("OpenCode returned an empty response");
      } finally {
        clearTimeout(timeoutId);
        if (sessionId) {
          void fetch(`${baseUrl}/session/${sessionId}${query}`, {
            method: "DELETE",
            headers,
          }).catch(() => {});
        }
      }
    },
    [projectPath, opencodePort],
  );

  const handleGenerateCommitMessageAI = useCallback(async () => {
    if (!projectPath) {
      toast("Please open a project first.", "error");
      return;
    }

    if (stagedChanges.length === 0) {
      toast("Stage files before generating commit message.", "error");
      return;
    }

    setShowCommitInput(true);
    setIsGeneratingCommitMessageAI(true);

    try {
      const status = await checkOpencodeStatus();
      if (!status?.installed) {
        toast(
          "OpenCode is not installed. Run: npm i -g opencode-ai@latest",
          "error",
        );
        return;
      }

      if (!status.running) {
        const started = await startOpencode(projectPath);
        if (!started) {
          toast("Failed to start OpenCode daemon.", "error");
          return;
        }
      }

      const diffChunks = await Promise.all(
        stagedChanges.map((change) => gitDiff(change.path, true)),
      );
      const mergedDiff = diffChunks
        .filter((chunk) => chunk.trim().length > 0)
        .join("\n\n")
        .slice(0, AI_COMMIT_DIFF_LIMIT)
        .trim();

      if (!mergedDiff) {
        toast("No textual staged diff available.", "error");
        return;
      }

      const prompt = buildAiCommitPrompt(mergedDiff, "staged");
      const aiRaw = await runOpenCodePrompt(prompt);
      const aiMessage = sanitizeAiCommitMessage(aiRaw);

      if (!aiMessage) {
        toast("AI returned an empty commit message.", "error");
        return;
      }

      setCommitMessage(aiMessage);
      toast("AI commit draft generated.", "success");
    } catch (error) {
      console.error("Failed to generate AI commit message:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast(`AI draft failed: ${errorMessage}`, "error");
    } finally {
      setIsGeneratingCommitMessageAI(false);
    }
  }, [
    projectPath,
    stagedChanges,
    checkOpencodeStatus,
    startOpencode,
    gitDiff,
    runOpenCodePrompt,
    toast,
  ]);

  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) return;
    const result = await gitCommit(commitMessage.trim());
    if (result.success) {
      toast("Changes committed", "success");
      setCommitMessage("");
      setShowCommitInput(false);
    } else {
      toast(result.error || "Failed to commit", "error");
    }
  }, [commitMessage, gitCommit, toast]);

  return {
    commitMessage,
    setCommitMessage,
    showCommitInput,
    setShowCommitInput,
    isGeneratingCommitMessageAI,
    handleGenerateCommitMessageAI,
    handleCommit,
  };
}
