import { pathSync } from "@/lib/path";

export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number,
): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

export type ParsedUnifiedDiff = {
  original: string;
  modified: string;
  added: number;
  removed: number;
  hasRenderableHunks: boolean;
  isBinary: boolean;
};

export function parseUnifiedDiffContent(content: string): ParsedUnifiedDiff {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const originalLines: string[] = [];
  const modifiedLines: string[] = [];
  let inHunk = false;
  let added = 0;
  let removed = 0;
  let isBinary = false;

  for (const line of lines) {
    if (
      line.startsWith("Binary files ") ||
      line.startsWith("GIT binary patch")
    ) {
      isBinary = true;
    }

    if (line.startsWith("@@")) {
      inHunk = true;
      continue;
    }

    if (!inHunk) continue;
    if (line === "\\ No newline at end of file") continue;

    if (line.startsWith("+") && !line.startsWith("+++")) {
      modifiedLines.push(line.slice(1));
      added += 1;
      continue;
    }

    if (line.startsWith("-") && !line.startsWith("---")) {
      originalLines.push(line.slice(1));
      removed += 1;
      continue;
    }

    if (line.startsWith(" ")) {
      const contextLine = line.slice(1);
      originalLines.push(contextLine);
      modifiedLines.push(contextLine);
      continue;
    }

    if (line.length === 0) {
      originalLines.push("");
      modifiedLines.push("");
    }
  }

  return {
    original: originalLines.join("\n"),
    modified: modifiedLines.join("\n"),
    added,
    removed,
    hasRenderableHunks: originalLines.length > 0 || modifiedLines.length > 0,
    isBinary,
  };
}

export type TreeNode = {
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
};

export function buildBasenameIndex(nodes: TreeNode[]): Map<string, string[]> {
  const index = new Map<string, string[]>();
  const stack = [...nodes];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) continue;

    if (node.type === "file") {
      const name = pathSync.basename(node.path);
      const existing = index.get(name);
      if (existing) {
        existing.push(node.path);
      } else {
        index.set(name, [node.path]);
      }
    }

    if (node.children && node.children.length > 0) {
      stack.push(...node.children);
    }
  }

  return index;
}

export function getFileType(path: string): "text" | "image" | "pdf" {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  if (
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)
  ) {
    return "image";
  }
  if (ext === "pdf") {
    return "pdf";
  }
  return "text";
}

export function getFileLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const languageMap: Record<string, string> = {
    tex: "latex",
    sty: "latex",
    cls: "latex",
    bib: "bibtex",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    md: "markdown",
    json: "json",
    css: "css",
    scss: "scss",
    less: "less",
    html: "html",
    htm: "html",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    java: "java",
    rs: "rust",
    go: "go",
    rb: "ruby",
    php: "php",
    sql: "sql",
    r: "r",
    lua: "lua",
    swift: "swift",
    kt: "kotlin",
    scala: "scala",
    toml: "toml",
    ini: "ini",
    conf: "ini",
    dockerfile: "dockerfile",
    makefile: "makefile",
  };
  return languageMap[ext] || "plaintext";
}
