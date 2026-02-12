export const AI_COMMIT_DIFF_LIMIT = 30000;
export const AI_COMMIT_TIMEOUT_MS = 90000;
export const OPENCODE_STORAGE_KEY_AGENT = "opencode-selected-agent";
export const OPENCODE_STORAGE_KEY_MODEL = "opencode-selected-model";

export type OpenCodeStatus = {
  running: boolean;
  port: number;
  installed: boolean;
};

export type OpenCodeDaemonStatus = "stopped" | "starting" | "running" | "unavailable";

export type OpenCodeMessagePart = {
  type?: string;
  text?: string;
};

export type OpenCodeMessageInfo = {
  id?: string;
  role?: string;
  parentID?: string;
  error?: {
    data?: {
      message?: string;
    };
  };
};

export type OpenCodeMessageItem = {
  info?: OpenCodeMessageInfo;
  parts?: OpenCodeMessagePart[];
};

export type PreferredOpenCodeConfig = {
  agent?: string;
  model?: {
    providerID: string;
    modelID: string;
  };
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extractTextParts(parts: OpenCodeMessagePart[] | undefined): string[] {
  if (!Array.isArray(parts)) return [];
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string);
}

export function parseOpenCodeMessageResponse(data: unknown): OpenCodeMessageItem | null {
  if (!data || typeof data !== "object") return null;
  const candidate = data as OpenCodeMessageItem;
  return candidate;
}

export function getPreferredOpenCodeConfig(): PreferredOpenCodeConfig {
  if (typeof window === "undefined") return {};

  let agent: string | undefined;
  let model:
    | {
        providerID: string;
        modelID: string;
      }
    | undefined;

  try {
    const savedAgent = localStorage.getItem(OPENCODE_STORAGE_KEY_AGENT);
    if (savedAgent) {
      agent = savedAgent;
    }

    const savedModelRaw = localStorage.getItem(OPENCODE_STORAGE_KEY_MODEL);
    if (savedModelRaw) {
      const savedModel = JSON.parse(savedModelRaw) as {
        providerId?: unknown;
        modelId?: unknown;
      };
      if (
        typeof savedModel.providerId === "string" &&
        typeof savedModel.modelId === "string"
      ) {
        model = {
          providerID: savedModel.providerId,
          modelID: savedModel.modelId,
        };
      }
    }
  } catch {
    return {};
  }

  return { agent, model };
}

export function sanitizeAiCommitMessage(raw: string): string {
  let text = raw.trim();

  text = text.replace(/^```[a-zA-Z]*\s*/m, "");
  text = text.replace(/\s*```$/, "");
  text = text.replace(/^commit message\s*[:：]\s*/i, "");

  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }

  return text.trim();
}

export function buildAiCommitPrompt(diff: string, scope: "staged" | "unstaged"): string {
  return [
    `Generate a git commit message from the following ${scope} changes.`,
    "Do not call tools. Only output the final commit message.",
    "Output rules:",
    "1. Return only the commit message text, no markdown and no code block.",
    "2. First line is a concise subject in imperative mood, <= 72 chars.",
    "3. Add a short body only when necessary.",
    "",
    "Diff:",
    diff,
  ].join("\n");
}
