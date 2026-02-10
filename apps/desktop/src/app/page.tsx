"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTauriDaemon } from "@/lib/tauri";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { InputDialog } from "@/components/ui/input-dialog";
import {
  TabBar,
  type TabItem,
  type TabReorderPosition,
  type TabDragMovePayload,
  type TabDragEndPayload,
} from "@/components/ui/tab-bar";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import { EditorErrorBoundary } from "@/components/editor/editor-error-boundary";
import {
  DockviewPanelLayout,
  type DockviewPanelItem,
} from "@/components/editor/dockview-panel-layout";
import { FileSidebarPanel } from "@/components/editor/sidebar-file-panel";
import { GitSidebarPanel } from "@/components/editor/sidebar-git-panel";
import { GitHubPublishDialog } from "@/components/editor/github-publish-dialog";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from "framer-motion";
import { UserDropdown, LoginCodeModal } from "@/components/auth";
import {
  useLatexSettings,
  useLatexCompiler,
  findTexFiles,
  findMainTexFile,
} from "@/lib/latex";
import { useEditorSettings } from "@/lib/editor";
import {
  LaTeXSettingsDialog,
  LaTeXInstallPrompt,
  MainFileSelectionDialog,
} from "@/components/latex";
import { RecentProjects } from "@/components/recent-projects";
import { useRecentProjects } from "@/lib/recent-projects";
import { pathSync } from "@/lib/path";
import type { MainFileDetectionResult } from "@/lib/latex/types";
import {
  ArrowClockwiseIcon,
  GearIcon,
  PlayCircleIcon,
  SidebarSimpleIcon,
  TerminalIcon,
  RobotIcon,
} from "@phosphor-icons/react";

function throttle<T extends (...args: Parameters<T>) => void>(
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

type OpenCodeStatus = {
  running: boolean;
  port: number;
  installed: boolean;
};

type OpenCodeDaemonStatus = "stopped" | "starting" | "running" | "unavailable";
type EditorViewMode = "file" | "git-diff";
type GitDiffPreviewState = {
  path: string;
  staged: boolean;
  content: string;
  isLoading: boolean;
  error: string | null;
};

type SplitPaneSide = "left" | "right";
type DragSourcePane = "primary" | "split";

type SplitPaneState = {
  side: SplitPaneSide;
  openTabs: string[];
  selectedFile?: string;
  content: string;
  isLoading: boolean;
  error: string | null;
  binaryPreviewUrl: string | null;
  pdfRefreshKey: number;
};

type ParsedUnifiedDiff = {
  original: string;
  modified: string;
  added: number;
  removed: number;
  hasRenderableHunks: boolean;
  isBinary: boolean;
};

function parseUnifiedDiffContent(content: string): ParsedUnifiedDiff {
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

type TreeNode = {
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
};

function buildBasenameIndex(nodes: TreeNode[]): Map<string, string[]> {
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

const AI_COMMIT_DIFF_LIMIT = 30000;
const AI_COMMIT_TIMEOUT_MS = 90000;
const OPENCODE_STORAGE_KEY_AGENT = "opencode-selected-agent";
const OPENCODE_STORAGE_KEY_MODEL = "opencode-selected-model";

type OpenCodeMessagePart = {
  type?: string;
  text?: string;
};

type OpenCodeMessageInfo = {
  id?: string;
  role?: string;
  parentID?: string;
  error?: {
    data?: {
      message?: string;
    };
  };
};

type OpenCodeMessageItem = {
  info?: OpenCodeMessageInfo;
  parts?: OpenCodeMessagePart[];
};

type PreferredOpenCodeConfig = {
  agent?: string;
  model?: {
    providerID: string;
    modelID: string;
  };
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractTextParts(parts: OpenCodeMessagePart[] | undefined): string[] {
  if (!Array.isArray(parts)) return [];
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string);
}

function parseOpenCodeMessageResponse(data: unknown): OpenCodeMessageItem | null {
  if (!data || typeof data !== "object") return null;
  const candidate = data as OpenCodeMessageItem;
  return candidate;
}

function getPreferredOpenCodeConfig(): PreferredOpenCodeConfig {
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

function sanitizeAiCommitMessage(raw: string): string {
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

function buildAiCommitPrompt(diff: string, scope: "staged" | "unstaged"): string {
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

const MonacoEditor = dynamic(
  () =>
    import("@/components/editor/monaco-editor").then((mod) => mod.MonacoEditor),
  { ssr: false },
);

const GitMonacoDiffEditor = dynamic(
  () =>
    import("@/components/editor/monaco-diff-editor").then(
      (mod) => mod.MonacoDiffEditor,
    ),
  {
    ssr: false,
    loading: () => <EditorSkeleton className="h-full" />,
  },
);

const EditorTerminal = dynamic(
  () => import("@/components/editor/terminal").then((mod) => mod.Terminal),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center px-4 text-sm text-muted">
        Loading terminal...
      </div>
    ),
  },
);

const OpenCodePanel = dynamic(
  () =>
    import("@/components/opencode/opencode-panel").then(
      (mod) => mod.OpenCodePanel,
    ),
  {
    ssr: false,
    loading: () => <OpenCodePanelSkeleton />,
  },
);

const OpenCodeDisconnectedDialog = dynamic(
  () =>
    import("@/components/opencode/opencode-disconnected-dialog").then(
      (mod) => mod.OpenCodeDisconnectedDialog,
    ),
  { ssr: false },
);

const OpenCodeErrorBoundary = dynamic(
  () =>
    import("@/components/opencode/opencode-error-boundary").then(
      (mod) => mod.OpenCodeErrorBoundary,
    ),
  { ssr: false },
);

const OpenCodeErrorDialog = dynamic(
  () =>
    import("@/components/opencode/opencode-error-dialog").then(
      (mod) => mod.OpenCodeErrorDialog,
    ),
  { ssr: false },
);

const PANEL_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.8,
} as const;

const INSTANT_TRANSITION = { duration: 0 } as const;

const _WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL || "https://writer.lmms-lab.com";

const MIN_PANEL_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 480;
const MIN_TERMINAL_HEIGHT = 120;
const MAX_TERMINAL_HEIGHT_RATIO = 0.5;

export default function EditorPage() {
  const editorSettings = useEditorSettings();
  const daemon = useTauriDaemon({
    gitAutoFetchEnabled: editorSettings.settings.gitAutoFetchEnabled,
    gitAutoFetchIntervalMs:
      editorSettings.settings.gitAutoFetchIntervalSeconds * 1000,
  });
  const prefersReducedMotion = useReducedMotion();
  const auth = useAuth();
  const { toast } = useToast();
  const recentProjects = useRecentProjects();

  const [selectedFile, setSelectedFile] = useState<string>();
  const [fileContent, setFileContent] = useState<string>("");
  const [editorViewMode, setEditorViewMode] = useState<EditorViewMode>("file");
  const [gitDiffPreview, setGitDiffPreview] = useState<GitDiffPreviewState | null>(null);
  const [splitPane, setSplitPane] = useState<SplitPaneState | null>(null);
  const [splitDropHint, setSplitDropHint] = useState<SplitPaneSide | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [binaryPreviewUrl, setBinaryPreviewUrl] = useState<string | null>(null);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebarWidth");
      return saved ? parseInt(saved, 10) : 280;
    }
    return 280;
  });
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rightPanelWidth");
      return saved ? parseInt(saved, 10) : 280;
    }
    return 280;
  });
  const [terminalHeight, setTerminalHeight] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("terminalHeight");
      return saved ? parseInt(saved, 10) : 224;
    }
    return 224;
  });
  const [resizing, setResizing] = useState<"sidebar" | "right" | "bottom" | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"files" | "git">("files");
  const [highlightedFile, _setHighlightedFile] = useState<string | null>(null);

  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitInput, setShowCommitInput] = useState(false);
  const [isGeneratingCommitMessageAI, setIsGeneratingCommitMessageAI] =
    useState(false);
  const [showRemoteInput, setShowRemoteInput] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [createDialog, setCreateDialog] = useState<{
    type: "file" | "directory";
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [opencodeDaemonStatus, setOpencodeDaemonStatus] =
    useState<OpenCodeDaemonStatus>("stopped");
  const [opencodePort, setOpencodePort] = useState(4096);
  const [showDisconnectedDialog, setShowDisconnectedDialog] = useState(false);
  const [showLatexSettings, setShowLatexSettings] = useState(false);
  const [showLoginCodeModal, setShowLoginCodeModal] = useState(false);
  const [pendingOpenCodeMessage, setPendingOpenCodeMessage] = useState<
    string | null
  >(null);
  const [opencodeError, setOpencodeError] = useState<string | null>(null);

  const [showMainFileDialog, setShowMainFileDialog] = useState(false);
  const [mainFileDetectionResult, setMainFileDetectionResult] = useState<MainFileDetectionResult | null>(null);
  const [showGitHubPublishDialog, setShowGitHubPublishDialog] = useState(false);
  const [ghPublishError, setGhPublishError] = useState<string | null>(null);

  const contentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const splitContentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const opencodeStartedForPathRef = useRef<string | null>(null);
  const savingVisualTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<{ path: string; time: number } | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const gitDiffRequestIdRef = useRef(0);
  const splitLoadRequestIdRef = useRef(0);
  const editorWorkspaceRef = useRef<HTMLDivElement | null>(null);

  // RAF-based resize refs for 60fps performance
  const sidebarWidthRef = useRef(sidebarWidth);
  const rightPanelWidthRef = useRef(rightPanelWidth);
  const terminalHeightRef = useRef(terminalHeight);

  const rafIdRef = useRef<number | null>(null);

  const gitStatus = daemon.gitStatus;
  const stagedChanges = useMemo(
    () => gitStatus?.changes.filter((c: { staged: boolean }) => c.staged) ?? [],
    [gitStatus?.changes],
  );
  const unstagedChanges = useMemo(
    () =>
      gitStatus?.changes.filter((c: { staged: boolean }) => !c.staged) ?? [],
    [gitStatus?.changes],
  );

  // LaTeX settings and editor settings
  const latexSettings = useLatexSettings();
  const texFiles = useMemo(() => findTexFiles(daemon.files), [daemon.files]);

  // Auto-detect main file when project opens
  useEffect(() => {
    if (daemon.files.length > 0 && !latexSettings.settings.mainFile) {
      const mainFile = findMainTexFile(daemon.files);
      if (mainFile) {
        latexSettings.setMainFile(mainFile);
      }
    }
  }, [daemon.files, latexSettings.settings.mainFile, latexSettings]);

  const latexCompiler = useLatexCompiler({
    settings: latexSettings.settings,
    projectPath: daemon.projectPath,
  });

  // Check if any LaTeX compiler is available
  const hasAnyCompiler =
    latexCompiler.compilersStatus &&
    (latexCompiler.compilersStatus.pdflatex.available ||
      latexCompiler.compilersStatus.xelatex.available ||
      latexCompiler.compilersStatus.lualatex.available ||
      latexCompiler.compilersStatus.latexmk.available);

  // Ensure .lmms_lab_writer/COMPILE_NOTES.md exists
  const ensureCompileNotesFile = useCallback(async () => {
    if (!daemon.projectPath) return;

    const dirPath = ".lmms_lab_writer";
    const filePath = ".lmms_lab_writer/COMPILE_NOTES.md";

    try {
      // Try to read the file first to check if it exists
      await daemon.readFile(filePath);
    } catch {
      // File doesn't exist, create it
      try {
        await daemon.createDirectory(dirPath);
      } catch {
        // Directory might already exist, ignore
      }

      const initialContent = `# Compilation Notes

This file stores compilation preferences and notes for this LaTeX project.
The AI assistant will read and update this file during compilation.

## Project Info
- Created: ${new Date().toISOString()}

## Compilation History
(Notes will be added here by the AI assistant)
`;
      await daemon.writeFile(filePath, initialContent);
    }
  }, [daemon]);

  // Handle compile with main file detection
  const handleCompileWithDetection = useCallback(async () => {
    if (!daemon.projectPath) return;

    // Ensure COMPILE_NOTES.md file exists before compilation
    await ensureCompileNotesFile();

    // Run detection
    const result = await latexSettings.detectMainFile(daemon.projectPath);

    if (!result) {
      toast("Failed to detect main file", "error");
      return;
    }

    // If detection found a main file and doesn't need user input, proceed
    if (result.main_file && !result.needs_user_input) {
      setShowRightPanel(true);
      setPendingOpenCodeMessage(
        latexSettings.settings.compilePrompt.replace("{mainFile}", result.main_file)
      );
      return;
    }

    // If we need user input (ambiguous case), show the dialog
    if (result.needs_user_input && result.tex_files.length > 0) {
      setMainFileDetectionResult(result);
      setShowMainFileDialog(true);
      return;
    }

    // No tex files found
    toast("No .tex files found in the project", "error");
  }, [daemon.projectPath, latexSettings, toast, ensureCompileNotesFile]);

  // Handle main file selection from dialog
  const handleMainFileSelect = useCallback((mainFile: string) => {
    latexSettings.setMainFile(mainFile);
    setShowMainFileDialog(false);
    setMainFileDetectionResult(null);

    // Proceed with compilation
    setShowRightPanel(true);
    setPendingOpenCodeMessage(
      latexSettings.settings.compilePrompt.replace("{mainFile}", mainFile)
    );
  }, [latexSettings]);

  const handleMainFileDialogCancel = useCallback(() => {
    setShowMainFileDialog(false);
    setMainFileDetectionResult(null);
  }, []);

  const checkOpencodeStatus = useCallback(async () => {
    try {
      const status = await invoke<OpenCodeStatus>("opencode_status");
      if (!status.installed) {
        setOpencodeDaemonStatus("unavailable");
      } else if (status.running) {
        setOpencodeDaemonStatus("running");
        setOpencodePort(status.port);
      } else {
        setOpencodeDaemonStatus("stopped");
      }
      return status;
    } catch {
      setOpencodeDaemonStatus("unavailable");
      return null;
    }
  }, []);

  const startOpencode = useCallback(
    async (directory: string) => {
      if (opencodeDaemonStatus === "unavailable") return null;
      try {
        setOpencodeDaemonStatus("starting");
        const status = await invoke<OpenCodeStatus>("opencode_start", {
          directory,
          port: 4096,
        });
        setOpencodeDaemonStatus("running");
        setOpencodePort(status.port);
        opencodeStartedForPathRef.current = directory;
        return status;
      } catch (err) {
        console.error("Failed to start OpenCode:", err);
        setOpencodeDaemonStatus("unavailable");
        toast(
          "OpenCode is not installed or configured correctly. Please install it from https://opencode.ai/ or run: npm i -g opencode-ai@latest",
          "error",
        );
        return null;
      }
    },
    [opencodeDaemonStatus, toast],
  );

  const restartOpencode = useCallback(async () => {
    if (!daemon.projectPath) {
      toast("Please open a project first.", "error");
      return;
    }

    // If status is "unavailable", re-check if OpenCode is now installed
    if (opencodeDaemonStatus === "unavailable") {
      const status = await checkOpencodeStatus();
      if (!status?.installed) {
        toast(
          "OpenCode is still not installed. Please install it first:\nnpm i -g opencode-ai@latest\nor\nbrew install sst/tap/opencode",
          "error",
        );
        return;
      }
      // OpenCode is now installed, proceed to start it
      if (!status.running) {
        await startOpencode(daemon.projectPath);
        toast("OpenCode started successfully!", "success");
      }
      return;
    }

    try {
      setOpencodeDaemonStatus("starting");
      setOpencodeError(null);
      const currentStatus = await invoke<OpenCodeStatus>("opencode_status");

      if (!currentStatus.installed) {
        setOpencodeDaemonStatus("unavailable");
        setOpencodeError(
          "OpenCode is not installed. Please install it first using npm or Homebrew.",
        );
        return;
      }

      const status = await invoke<OpenCodeStatus>("opencode_restart", {
        directory: daemon.projectPath,
      });
      setOpencodeDaemonStatus("running");
      setOpencodePort(status.port);
      toast("OpenCode started successfully!", "success");
    } catch (err) {
      console.error("Failed to start OpenCode:", err);
      setOpencodeDaemonStatus("stopped");
      const errorMessage = err instanceof Error ? err.message : String(err);
      setOpencodeError(errorMessage);
    }
  }, [
    daemon.projectPath,
    opencodeDaemonStatus,
    toast,
    checkOpencodeStatus,
    startOpencode,
  ]);

  const handleMaxReconnectFailed = useCallback(() => {
    setShowDisconnectedDialog(true);
  }, []);

  const handleCloseDisconnectedDialog = useCallback(() => {
    setShowDisconnectedDialog(false);
  }, []);

  const handleRestartFromDialog = useCallback(() => {
    setShowDisconnectedDialog(false);
    restartOpencode();
  }, [restartOpencode]);

  const handleCloseErrorDialog = useCallback(() => {
    setOpencodeError(null);
  }, []);

  const handleKillPort = useCallback(
    async (port: number) => {
      await invoke("kill_port_process", { port });
      setOpencodeError(null);
      await restartOpencode();
    },
    [restartOpencode],
  );

  const handleToggleRightPanel = useCallback(async () => {
    const willOpen = !showRightPanel;
    setShowRightPanel(willOpen);

    if (willOpen && daemon.projectPath && opencodeDaemonStatus === "stopped") {
      const status = await checkOpencodeStatus();
      if (status?.installed && !status.running) {
        await startOpencode(daemon.projectPath);
      } else if (status?.running) {
        opencodeStartedForPathRef.current = daemon.projectPath;
      }
    }
  }, [
    showRightPanel,
    daemon.projectPath,
    opencodeDaemonStatus,
    checkOpencodeStatus,
    startOpencode,
  ]);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    localStorage.setItem("rightPanelWidth", String(rightPanelWidth));
  }, [rightPanelWidth]);

  useEffect(() => {
    localStorage.setItem("terminalHeight", String(terminalHeight));
  }, [terminalHeight]);


  useEffect(() => {
    checkOpencodeStatus();
  }, [checkOpencodeStatus]);

  useEffect(() => {
    if (!daemon.projectPath) {
      opencodeStartedForPathRef.current = null;
      if (splitContentSaveTimeoutRef.current) {
        clearTimeout(splitContentSaveTimeoutRef.current);
        splitContentSaveTimeoutRef.current = null;
      }
      setSplitPane(null);
    }
  }, [daemon.projectPath]);

  useEffect(() => {
    setShowTerminal(Boolean(daemon.projectPath));
  }, [daemon.projectPath]);

  useEffect(() => {
    return () => {
      if (splitContentSaveTimeoutRef.current) {
        clearTimeout(splitContentSaveTimeoutRef.current);
        splitContentSaveTimeoutRef.current = null;
      }
    };
  }, []);

  // Listen for opencode logs from Tauri backend
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<{ type: string; message: string }>("opencode-log", (event) => {
        const { type, message } = event.payload;
        if (type === "stderr") {
          console.error("[OpenCode]", message);
        }
      }).then((fn) => {
        unlisten = fn;
      });
    });

    return () => {
      unlisten?.();
    };
  }, []);

  const startResize = useCallback(
    (panel: "sidebar" | "right" | "bottom") => {
      setResizing(panel);
      sidebarWidthRef.current = sidebarWidth;
      rightPanelWidthRef.current = rightPanelWidth;
      terminalHeightRef.current = terminalHeight;
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${sidebarWidth}px`,
      );
      document.documentElement.style.setProperty(
        "--right-panel-width",
        `${rightPanelWidth}px`,
      );
      document.documentElement.style.setProperty(
        "--terminal-height",
        `${terminalHeight}px`,
      );
    },
    [sidebarWidth, rightPanelWidth, terminalHeight],
  );

  const handleResizeDrag = useCallback((panel: "sidebar" | "right" | "bottom", info: PanInfo) => {
    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      if (panel === "sidebar") {
        const newWidth = Math.min(
          Math.max(info.point.x, MIN_PANEL_WIDTH),
          MAX_SIDEBAR_WIDTH,
        );
        sidebarWidthRef.current = newWidth;
        document.documentElement.style.setProperty(
          "--sidebar-width",
          `${newWidth}px`,
        );
      } else if (panel === "right") {
        const maxRightWidth = Math.floor(window.innerWidth / 2);
        const newWidth = Math.min(
          Math.max(window.innerWidth - info.point.x, MIN_PANEL_WIDTH),
          maxRightWidth,
        );
        rightPanelWidthRef.current = newWidth;
        document.documentElement.style.setProperty(
          "--right-panel-width",
          `${newWidth}px`,
        );
      } else if (panel === "bottom") {
        const maxHeight = Math.floor(window.innerHeight * MAX_TERMINAL_HEIGHT_RATIO);
        const newHeight = Math.min(
          Math.max(window.innerHeight - info.point.y, MIN_TERMINAL_HEIGHT),
          maxHeight,
        );
        terminalHeightRef.current = newHeight;
        document.documentElement.style.setProperty(
          "--terminal-height",
          `${newHeight}px`,
        );
      }
      rafIdRef.current = null;
    });
  }, []);

  const endResize = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setSidebarWidth(sidebarWidthRef.current);
    setRightPanelWidth(rightPanelWidthRef.current);
    setTerminalHeight(terminalHeightRef.current);
    document.documentElement.style.removeProperty("--sidebar-width");
    document.documentElement.style.removeProperty("--right-panel-width");
    document.documentElement.style.removeProperty("--terminal-height");
    setResizing(null);
  }, []);

  useEffect(() => {
    const COMPACT_THRESHOLD = 1100;

    const handleResize = throttle(() => {
      if (window.innerWidth < COMPACT_THRESHOLD) {
        setShowRightPanel(false);
      }
    }, 100);

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getFileType = useCallback((path: string): "text" | "image" | "pdf" => {
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
  }, []);

  const getFileLanguage = useCallback((path: string): string => {
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
  }, []);

  const filesByBasename = useMemo(
    () => buildBasenameIndex(daemon.files as TreeNode[]),
    [daemon.files],
  );

  const resolveSelectablePath = useCallback(
    (candidatePath: string): string => {
      const normalized = candidatePath.replace(/\\/g, "/");
      if (normalized.includes("/")) {
        return normalized;
      }

      const matches = filesByBasename.get(normalized) ?? [];
      if (matches.length === 0) {
        return normalized;
      }

      if (matches.length > 1) {
        const preferred = matches[0];
        if (preferred) {
          toast(
            `Multiple files named "${normalized}" found. Opening "${preferred}".`,
            "error",
          );
          return preferred;
        }
      }

      return matches[0] ?? normalized;
    },
    [filesByBasename, toast],
  );

  const handleFileSelect = useCallback(
    async (path: string) => {
      const resolvedPath = resolveSelectablePath(path);
      setEditorViewMode("file");
      setGitDiffPreview(null);
      const fileType = getFileType(resolvedPath);

      setOpenTabs((prev) => {
        if (prev.includes(resolvedPath)) return prev;
        return [...prev, resolvedPath];
      });
      setSelectedFile(resolvedPath);
      setBinaryPreviewUrl(null);

      if (fileType === "text") {
        setIsLoadingFile(true);
        try {
          const content = await daemon.readFile(resolvedPath);
          setFileContent(content ?? "");
        } catch (err) {
          const errorStr = String(err);

          // Handle file not found - remove from tabs and notify user
          if (errorStr.includes("FILE_NOT_FOUND")) {
            const fileName = pathSync.basename(resolvedPath);
            toast(
              `File "${fileName}" no longer exists and has been removed from tabs`,
              "error",
            );

            // Remove the file from open tabs
            setOpenTabs((prev) => {
              const newTabs = prev.filter((p) => p !== resolvedPath);

              // Switch to another tab if available
              if (newTabs.length > 0) {
                const nextFile = newTabs[0];
                if (nextFile) {
                  // Recursively try to open the next file
                  setTimeout(() => handleFileSelect(nextFile), 0);
                }
              } else {
                // No more tabs, clear selection
                setSelectedFile(undefined);
                setFileContent("");
              }

              return newTabs;
            });
          } else {
            console.error("Failed to read file:", err);
            toast(`Failed to read file: ${err}`, "error");
            setFileContent("");
          }
        } finally {
          setIsLoadingFile(false);
        }
      } else {
        const fullPath = daemon.projectPath
          ? pathSync.join(daemon.projectPath, resolvedPath)
          : resolvedPath;
        setBinaryPreviewUrl(convertFileSrc(fullPath));
        setFileContent("");
      }
    },
    [daemon, getFileType, resolveSelectablePath, toast],
  );

  const loadGitDiffPreview = useCallback(
    async (path: string, staged: boolean) => {
      const requestId = gitDiffRequestIdRef.current + 1;
      gitDiffRequestIdRef.current = requestId;

      setGitDiffPreview({
        path,
        staged,
        content: "",
        isLoading: true,
        error: null,
      });

      try {
        const content = await daemon.gitDiff(path, staged);
        if (gitDiffRequestIdRef.current !== requestId) return;
        setGitDiffPreview({
          path,
          staged,
          content,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (gitDiffRequestIdRef.current !== requestId) return;
        setGitDiffPreview({
          path,
          staged,
          content: "",
          isLoading: false,
          error: String(error),
        });
      }
    },
    [daemon],
  );

  const handlePreviewGitDiff = useCallback(
    async (path: string, staged: boolean) => {
      setOpenTabs((prev) => {
        if (prev.includes(path)) return prev;
        return [...prev, path];
      });
      setSelectedFile(path);
      setBinaryPreviewUrl(null);
      setEditorViewMode("git-diff");
      await loadGitDiffPreview(path, staged);
    },
    [loadGitDiffPreview],
  );

  useEffect(() => {
    if (selectedFile && !openTabs.includes(selectedFile)) {
      setOpenTabs((prev) => [...prev, selectedFile]);
    }
  }, [selectedFile, openTabs]);

  // Handle file changes - deletion and external modifications
  useEffect(() => {
    if (!daemon.lastFileChange) return;

    const { path, kind } = daemon.lastFileChange;

    if (kind === "remove") {
      if (splitPane?.openTabs.includes(path)) {
        setSplitPane(null);
      }
      // Check if the deleted file is in open tabs
      setOpenTabs((prev) => {
        if (!prev.includes(path)) return prev;

        const newTabs = prev.filter((p) => p !== path);

        // If the deleted file was selected, switch to another tab
        if (selectedFile === path) {
          if (newTabs.length > 0) {
            const nextFile = newTabs[0];
            if (nextFile) {
              handleFileSelect(nextFile);
            }
          } else {
            setSelectedFile(undefined);
            setFileContent("");
            setBinaryPreviewUrl(null);
            setGitDiffPreview(null);
            setEditorViewMode("file");
          }
        }

        return newTabs;
      });
    } else if (kind === "modify") {
      // Reload file content if the currently selected file was modified externally
      // Skip if this was our own save (within 2 seconds)
      const lastSave = lastSaveTimeRef.current;
      const isOurSave = lastSave &&
        lastSave.path === path &&
        Date.now() - lastSave.time < 2000;

      if (path === selectedFile && !isOurSave) {
        daemon.readFile(path).then((content) => {
          if (content !== null) {
            setFileContent(content);
          }
        }).catch((err) => {
          console.error("Failed to reload modified file:", err);
        });
      }

      if (
        splitPane &&
        path === splitPane.selectedFile &&
        !splitPane.binaryPreviewUrl &&
        !isOurSave
      ) {
        daemon.readFile(path).then((content) => {
          if (content !== null) {
            setSplitPane((prev) => {
              if (!prev || prev.selectedFile !== path) return prev;
              return {
                ...prev,
                content,
                error: null,
              };
            });
          }
        }).catch((err) => {
          console.error("Failed to reload modified split file:", err);
        });
      }
    }
  }, [daemon.lastFileChange, selectedFile, handleFileSelect, daemon, splitPane]);

  const handleCloseTab = useCallback(
    (path: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setOpenTabs((prev) => {
        const newTabs = prev.filter((p) => p !== path);
        if (selectedFile === path) {
          const idx = prev.indexOf(path);
          const newSelected = newTabs[Math.min(idx, newTabs.length - 1)];
          if (newSelected) {
            handleFileSelect(newSelected);
          } else {
            setSelectedFile(undefined);
            setFileContent("");
            setBinaryPreviewUrl(null);
            setGitDiffPreview(null);
            setEditorViewMode("file");
          }
        }
        return newTabs;
      });
    },
    [selectedFile, handleFileSelect],
  );

  const handleCloseOtherTabs = useCallback(
    (keepPath: string) => {
      setOpenTabs([keepPath]);
      if (selectedFile !== keepPath) {
        handleFileSelect(keepPath);
      }
    },
    [selectedFile, handleFileSelect],
  );

  const handleCloseTabsToLeft = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        const idx = prev.indexOf(path);
        if (idx <= 0) return prev;
        const newTabs = prev.slice(idx);
        if (selectedFile && !newTabs.includes(selectedFile)) {
          handleFileSelect(path);
        }
        return newTabs;
      });
    },
    [selectedFile, handleFileSelect],
  );

  const handleCloseTabsToRight = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        const idx = prev.indexOf(path);
        if (idx === prev.length - 1) return prev;
        const newTabs = prev.slice(0, idx + 1);
        if (selectedFile && !newTabs.includes(selectedFile)) {
          handleFileSelect(path);
        }
        return newTabs;
      });
    },
    [selectedFile, handleFileSelect],
  );

  const handleCloseAllTabs = useCallback(() => {
    setOpenTabs([]);
    setSelectedFile(undefined);
    setFileContent("");
    setGitDiffPreview(null);
    setEditorViewMode("file");
    setSplitPane(null);
  }, []);

  const handleReorderTabs = useCallback(
    (
      draggedPath: string,
      targetPath: string,
      position: TabReorderPosition,
    ) => {
      if (draggedPath === targetPath) return;

      setOpenTabs((prev) => {
        const fromIndex = prev.indexOf(draggedPath);
        const targetIndex = prev.indexOf(targetPath);
        if (fromIndex < 0 || targetIndex < 0) return prev;

        const reordered = [...prev];
        const [movedTab] = reordered.splice(fromIndex, 1);
        if (!movedTab) return prev;

        const targetAfterRemoval = reordered.indexOf(targetPath);
        if (targetAfterRemoval < 0) return prev;

        const insertIndex =
          position === "before" ? targetAfterRemoval : targetAfterRemoval + 1;
        reordered.splice(insertIndex, 0, movedTab);
        return reordered;
      });
    },
    [],
  );

  const closeSplitPane = useCallback(() => {
    if (splitContentSaveTimeoutRef.current) {
      clearTimeout(splitContentSaveTimeoutRef.current);
      splitContentSaveTimeoutRef.current = null;
    }
    setSplitPane(null);
  }, []);

  const openFileInSplitPane = useCallback(
    async (
      path: string,
      side: SplitPaneSide,
      options?: { moveFromPrimary?: boolean },
    ) => {
      const resolvedPath = resolveSelectablePath(path);
      const fileType = getFileType(resolvedPath);
      const requestId = splitLoadRequestIdRef.current + 1;
      splitLoadRequestIdRef.current = requestId;

      if (splitContentSaveTimeoutRef.current) {
        clearTimeout(splitContentSaveTimeoutRef.current);
        splitContentSaveTimeoutRef.current = null;
      }

      if (options?.moveFromPrimary) {
        setOpenTabs((prev) => {
          if (!prev.includes(resolvedPath)) return prev;

          const idx = prev.indexOf(resolvedPath);
          const newTabs = prev.filter((p) => p !== resolvedPath);
          if (selectedFile === resolvedPath) {
            const nextFile = newTabs[Math.min(idx, newTabs.length - 1)];
            if (nextFile) {
              void handleFileSelect(nextFile);
            } else {
              setSelectedFile(undefined);
              setFileContent("");
              setBinaryPreviewUrl(null);
              setGitDiffPreview(null);
              setEditorViewMode("file");
            }
          }
          return newTabs;
        });
      }

      if (fileType === "text") {
        setSplitPane((prev) => {
          const base: SplitPaneState = prev ?? {
            side,
            openTabs: [],
            selectedFile: undefined,
            content: "",
            isLoading: false,
            error: null,
            binaryPreviewUrl: null,
            pdfRefreshKey: 0,
          };
          return {
            ...base,
            side,
            openTabs: base.openTabs.includes(resolvedPath)
              ? base.openTabs
              : [...base.openTabs, resolvedPath],
            selectedFile: resolvedPath,
            content: "",
            isLoading: true,
            error: null,
            binaryPreviewUrl: null,
          };
        });

        try {
          const content = await daemon.readFile(resolvedPath);
          if (splitLoadRequestIdRef.current !== requestId) return;
          setSplitPane((prev) => {
            if (!prev || prev.selectedFile !== resolvedPath) return prev;
            return {
              ...prev,
              side,
              content: content ?? "",
              isLoading: false,
              error: null,
              binaryPreviewUrl: null,
            };
          });
        } catch (err) {
          if (splitLoadRequestIdRef.current !== requestId) return;
          const errorStr = String(err);
          if (errorStr.includes("FILE_NOT_FOUND")) {
            toast(
              `File "${pathSync.basename(resolvedPath)}" no longer exists`,
              "error",
            );
            setSplitPane(null);
            return;
          }
          setSplitPane((prev) => {
            if (!prev || prev.selectedFile !== resolvedPath) return prev;
            return {
              ...prev,
              isLoading: false,
              error: errorStr,
            };
          });
        }
        return;
      }

      const fullPath = daemon.projectPath
        ? pathSync.join(daemon.projectPath, resolvedPath)
        : resolvedPath;
      setSplitPane((prev) => {
        const base: SplitPaneState = prev ?? {
          side,
          openTabs: [],
          selectedFile: undefined,
          content: "",
          isLoading: false,
          error: null,
          binaryPreviewUrl: null,
          pdfRefreshKey: 0,
        };
        return {
          ...base,
          side,
          openTabs: base.openTabs.includes(resolvedPath)
            ? base.openTabs
            : [...base.openTabs, resolvedPath],
          selectedFile: resolvedPath,
          content: "",
          isLoading: false,
          error: null,
          binaryPreviewUrl: convertFileSrc(fullPath),
          pdfRefreshKey: 0,
        };
      });
    },
    [
      daemon,
      getFileType,
      resolveSelectablePath,
      toast,
      selectedFile,
      handleFileSelect,
    ],
  );

  const handleSplitContentChange = useCallback(
    (content: string) => {
      setSplitPane((prev) => {
        if (!prev || prev.binaryPreviewUrl) return prev;
        return {
          ...prev,
          content,
        };
      });

      if (splitContentSaveTimeoutRef.current) {
        clearTimeout(splitContentSaveTimeoutRef.current);
      }

      const fileToSave = splitPane?.selectedFile;
      if (!fileToSave) return;

      splitContentSaveTimeoutRef.current = setTimeout(async () => {
        try {
          await daemon.writeFile(fileToSave, content);
          lastSaveTimeRef.current = { path: fileToSave, time: Date.now() };
        } catch (error) {
          console.error("Failed to save split pane file:", error);
        }
      }, 500);
    },
    [daemon, splitPane?.selectedFile],
  );

  const handleSplitTabSelect = useCallback(
    (path: string) => {
      if (!splitPane) return;
      void openFileInSplitPane(path, splitPane.side);
    },
    [splitPane, openFileInSplitPane],
  );

  const handleSplitCloseTab = useCallback(
    (path: string) => {
      if (!splitPane) return;

      const idx = splitPane.openTabs.indexOf(path);
      if (idx < 0) return;
      const newTabs = splitPane.openTabs.filter((p) => p !== path);
      if (newTabs.length === 0) {
        closeSplitPane();
        return;
      }

      const nextSelected =
        splitPane.selectedFile === path
          ? newTabs[Math.min(idx, newTabs.length - 1)]
          : splitPane.selectedFile ?? newTabs[0];

      setSplitPane((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          openTabs: newTabs,
          selectedFile: nextSelected,
        };
      });

      if (splitPane.selectedFile === path && nextSelected) {
        void openFileInSplitPane(nextSelected, splitPane.side);
      }
    },
    [splitPane, closeSplitPane, openFileInSplitPane],
  );

  const handleSplitCloseOtherTabs = useCallback(
    (keepPath: string) => {
      if (!splitPane) return;
      setSplitPane((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          openTabs: [keepPath],
          selectedFile: keepPath,
        };
      });
      if (splitPane.selectedFile !== keepPath) {
        void openFileInSplitPane(keepPath, splitPane.side);
      }
    },
    [splitPane, openFileInSplitPane],
  );

  const handleSplitCloseTabsToLeft = useCallback(
    (path: string) => {
      if (!splitPane) return;
      const idx = splitPane.openTabs.indexOf(path);
      if (idx <= 0) return;
      const newTabs = splitPane.openTabs.slice(idx);
      setSplitPane((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          openTabs: newTabs,
          selectedFile:
            prev.selectedFile && newTabs.includes(prev.selectedFile)
              ? prev.selectedFile
              : path,
        };
      });
      if (splitPane.selectedFile && !newTabs.includes(splitPane.selectedFile)) {
        void openFileInSplitPane(path, splitPane.side);
      }
    },
    [splitPane, openFileInSplitPane],
  );

  const handleSplitCloseTabsToRight = useCallback(
    (path: string) => {
      if (!splitPane) return;
      const idx = splitPane.openTabs.indexOf(path);
      if (idx === splitPane.openTabs.length - 1) return;
      const newTabs = splitPane.openTabs.slice(0, idx + 1);
      setSplitPane((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          openTabs: newTabs,
          selectedFile:
            prev.selectedFile && newTabs.includes(prev.selectedFile)
              ? prev.selectedFile
              : path,
        };
      });
      if (splitPane.selectedFile && !newTabs.includes(splitPane.selectedFile)) {
        void openFileInSplitPane(path, splitPane.side);
      }
    },
    [splitPane, openFileInSplitPane],
  );

  const handleSplitReorderTabs = useCallback(
    (
      draggedPath: string,
      targetPath: string,
      position: TabReorderPosition,
    ) => {
      if (draggedPath === targetPath) return;
      setSplitPane((prev) => {
        if (!prev) return prev;
        const fromIndex = prev.openTabs.indexOf(draggedPath);
        const targetIndex = prev.openTabs.indexOf(targetPath);
        if (fromIndex < 0 || targetIndex < 0) return prev;

        const reordered = [...prev.openTabs];
        const [movedTab] = reordered.splice(fromIndex, 1);
        if (!movedTab) return prev;

        const targetAfterRemoval = reordered.indexOf(targetPath);
        if (targetAfterRemoval < 0) return prev;

        const insertIndex =
          position === "before" ? targetAfterRemoval : targetAfterRemoval + 1;
        reordered.splice(insertIndex, 0, movedTab);
        return {
          ...prev,
          openTabs: reordered,
        };
      });
    },
    [],
  );

  const resolveSplitDropSide = useCallback(
    (
      clientX: number,
      clientY: number,
      source: DragSourcePane,
    ): SplitPaneSide | null => {
      const container = editorWorkspaceRef.current;
      if (!container) return null;

      const rect = container.getBoundingClientRect();
      const isInsideEditorWorkspace =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (!isInsideEditorWorkspace) return null;

      const hoveredSide: SplitPaneSide =
        clientX < rect.left + rect.width / 2 ? "left" : "right";

      if (!splitPane) return source === "primary" ? hoveredSide : null;

      const splitSide: SplitPaneSide = splitPane.side;
      const primarySide: SplitPaneSide =
        splitSide === "left" ? "right" : "left";

      if (source === "primary") {
        return hoveredSide === splitSide ? splitSide : null;
      }

      return hoveredSide === primarySide ? primarySide : null;
    },
    [splitPane],
  );

  const handleEditorTabDragMove = useCallback(
    (payload: TabDragMovePayload | null) => {
      if (!payload) {
        setSplitDropHint(null);
        return;
      }

      setSplitDropHint(
        resolveSplitDropSide(payload.clientX, payload.clientY, "primary"),
      );
    },
    [resolveSplitDropSide],
  );

  const moveTabFromSplitToPrimary = useCallback(
    (path: string) => {
      if (!splitPane) return;
      const resolvedPath = resolveSelectablePath(path);
      const currentIndex = splitPane.openTabs.indexOf(resolvedPath);
      if (currentIndex < 0) return;

      const nextTabs = splitPane.openTabs.filter((p) => p !== resolvedPath);
      if (nextTabs.length === 0) {
        closeSplitPane();
      } else {
        const nextSelected =
          splitPane.selectedFile === resolvedPath
            ? nextTabs[Math.min(currentIndex, nextTabs.length - 1)]
            : splitPane.selectedFile ?? nextTabs[0];

        setSplitPane((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            openTabs: nextTabs,
            selectedFile: nextSelected,
          };
        });

        if (splitPane.selectedFile === resolvedPath && nextSelected) {
          void openFileInSplitPane(nextSelected, splitPane.side);
        }
      }

      void handleFileSelect(resolvedPath);
    },
    [
      splitPane,
      resolveSelectablePath,
      closeSplitPane,
      openFileInSplitPane,
      handleFileSelect,
    ],
  );

  const handleSplitTabDragMove = useCallback(
    (payload: TabDragMovePayload | null) => {
      if (!payload) {
        setSplitDropHint(null);
        return;
      }

      setSplitDropHint(
        resolveSplitDropSide(payload.clientX, payload.clientY, "split"),
      );
    },
    [resolveSplitDropSide],
  );

  const handleEditorTabDragEnd = useCallback(
    (payload: TabDragEndPayload) => {
      setSplitDropHint(null);
      if (payload.dropTarget.type !== "outside") return;

      const side = resolveSplitDropSide(
        payload.clientX,
        payload.clientY,
        "primary",
      );
      if (!side) return;

      void openFileInSplitPane(payload.tabId, side, { moveFromPrimary: true });
    },
    [openFileInSplitPane, resolveSplitDropSide],
  );

  const handleSplitTabDragEnd = useCallback(
    (payload: TabDragEndPayload) => {
      setSplitDropHint(null);
      if (payload.dropTarget.type !== "outside") return;

      const side = resolveSplitDropSide(
        payload.clientX,
        payload.clientY,
        "split",
      );
      if (!side || !splitPane) return;

      const primarySide: SplitPaneSide =
        splitPane.side === "left" ? "right" : "left";
      if (side !== primarySide) return;

      moveTabFromSplitToPrimary(payload.tabId);
    },
    [resolveSplitDropSide, splitPane, moveTabFromSplitToPrimary],
  );

  const splitPaneTabs = useMemo(
    (): TabItem[] =>
      splitPane?.openTabs.map((path) => ({
        id: path,
        label: pathSync.basename(path),
        title: path,
      })) ?? [],
    [splitPane?.openTabs],
  );

  const renderSplitPane = useCallback(
    (side: SplitPaneSide) => {
      if (!splitPane || splitPane.side !== side) return null;
      const splitSelectedFile = splitPane.selectedFile;
      const splitFileType = splitSelectedFile ? getFileType(splitSelectedFile) : "text";

      return (
        <div className="h-full min-h-0 flex flex-col overflow-hidden">
          {splitSelectedFile && (
            <div>
              <TabBar
                tabs={splitPaneTabs}
                activeTab={splitSelectedFile}
                onTabSelect={handleSplitTabSelect}
                onTabClose={handleSplitCloseTab}
                onTabReorder={handleSplitReorderTabs}
                onTabDragMove={handleSplitTabDragMove}
                onTabDragEnd={handleSplitTabDragEnd}
                onCloseOthers={handleSplitCloseOtherTabs}
                onCloseToLeft={handleSplitCloseTabsToLeft}
                onCloseToRight={handleSplitCloseTabsToRight}
                onCloseAll={closeSplitPane}
                variant="editor"
              />
            </div>
          )}

          <div className="flex-1 min-h-0">
            {!splitSelectedFile ? (
              <div className="h-full flex items-center justify-center px-6 text-sm text-muted">
                Drag a tab here to open a second editor group.
              </div>
            ) : splitPane.isLoading ? (
              <EditorSkeleton className="h-full" />
            ) : splitPane.error ? (
              <div className="h-full flex items-center justify-center px-6 text-sm text-muted">
                Failed to load file: {splitPane.error}
              </div>
            ) : splitPane.binaryPreviewUrl ? (
              <div className="h-full flex items-center justify-center overflow-auto p-4 bg-accent-hover">
                {splitFileType === "image" ? (
                  <img
                    src={splitPane.binaryPreviewUrl}
                    alt={splitSelectedFile}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <iframe
                    key={splitPane.pdfRefreshKey}
                    src={splitPane.binaryPreviewUrl}
                    className="w-full h-full border-0"
                    title={`PDF: ${splitSelectedFile}`}
                  />
                )}
              </div>
            ) : (
              <EditorErrorBoundary>
                <MonacoEditor
                  content={splitPane.content}
                  readOnly={false}
                  onContentChange={handleSplitContentChange}
                  language={getFileLanguage(splitSelectedFile)}
                  editorSettings={editorSettings.settings}
                  editorTheme={editorSettings.editorTheme}
                  className="h-full"
                />
              </EditorErrorBoundary>
            )}
          </div>
        </div>
      );
    },
    [
      splitPane,
      getFileType,
      closeSplitPane,
      splitPaneTabs,
      handleSplitTabSelect,
      handleSplitCloseTab,
      handleSplitReorderTabs,
      handleSplitTabDragMove,
      handleSplitTabDragEnd,
      handleSplitCloseOtherTabs,
      handleSplitCloseTabsToLeft,
      handleSplitCloseTabsToRight,
      handleSplitContentChange,
      getFileLanguage,
      editorSettings.settings,
      editorSettings.editorTheme,
    ],
  );

  // Convert openTabs to TabItem format for TabBar
  const editorTabs = useMemo(
    (): TabItem[] =>
      openTabs.map((path) => ({
        id: path,
        label: pathSync.basename(path),
        title: path,
      })),
    [openTabs],
  );

  // Sidebar tabs configuration
  const sidebarTabs = useMemo(
    (): TabItem[] => [
      { id: "files", label: "Files" },
      {
        id: "git",
        label: "Git",
        badge:
          gitStatus && gitStatus.changes.length > 0
            ? gitStatus.changes.length
            : undefined,
      },
    ],
    [gitStatus],
  );

  const handleContentChange = useCallback(
    (content: string) => {
      setFileContent(content);

      if (savingVisualTimeoutRef.current) {
        clearTimeout(savingVisualTimeoutRef.current);
      }

      savingVisualTimeoutRef.current = setTimeout(() => {
        setIsSaving(true);
      }, 300);

      if (contentSaveTimeoutRef.current) {
        clearTimeout(contentSaveTimeoutRef.current);
      }

      // Capture the current file at callback creation time to prevent race condition
      // when user switches files rapidly during debounce window
      const fileToSave = selectedFile;
      contentSaveTimeoutRef.current = setTimeout(async () => {
        if (fileToSave) {
          try {
            await daemon.writeFile(fileToSave, content);
            // Track when we saved this file to avoid reloading our own changes
            lastSaveTimeRef.current = { path: fileToSave, time: Date.now() };
          } catch (error) {
            console.error("Failed to save file:", error);
          }
        }
        if (savingVisualTimeoutRef.current) {
          clearTimeout(savingVisualTimeoutRef.current);
          savingVisualTimeoutRef.current = null;
        }
        setIsSaving(false);
      }, 500);
    },
    [selectedFile, daemon],
  );

  const handleOpenFolder = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select LaTeX Project",
      });

      if (selected && typeof selected === "string") {
        await daemon.setProject(selected);
        await recentProjects.addProject(selected);
        setShowSidebar(true);
        setShowRightPanel(true);
      }
    } catch (err) {
      console.error("Failed to open project:", err);
    }
  }, [daemon, recentProjects]);

  const handleOpenRecentProject = useCallback(
    async (path: string) => {
      try {
        await daemon.setProject(path);
        await recentProjects.addProject(path);
        setShowSidebar(true);
        setShowRightPanel(true);
      } catch (err) {
        console.error("Failed to open project:", err);
        toast("Failed to open project", "error");
        recentProjects.removeProject(path);
      }
    },
    [daemon, recentProjects, toast]
  );

  const handleStageAll = useCallback(() => {
    if (!gitStatus) return;
    const unstaged = gitStatus.changes
      .filter((c: { staged: boolean }) => !c.staged)
      .map((c: { path: string }) => c.path);
    if (unstaged.length > 0) {
      daemon.gitAdd(unstaged);
    }
  }, [gitStatus, daemon]);

  const handleStageFile = useCallback(
    (path: string) => {
      daemon.gitAdd([path]);
    },
    [daemon],
  );

  const handleUnstageAll = useCallback(() => {
    const stagedPaths = (daemon.gitStatus?.changes ?? [])
      .filter((c) => c.staged)
      .map((c) => c.path);
    if (stagedPaths.length > 0) {
      daemon.gitUnstage(stagedPaths);
    }
  }, [daemon]);

  const handleUnstageFile = useCallback(
    (path: string) => {
      daemon.gitUnstage([path]);
    },
    [daemon],
  );

  const handleRemoteSubmit = useCallback(() => {
    const trimmed = remoteUrl.trim();
    if (!trimmed) return;
    daemon.gitAddRemote(trimmed);
    setRemoteUrl("");
    setShowRemoteInput(false);
  }, [daemon, remoteUrl]);

  const handleGitPush = useCallback(async () => {
    const result = await daemon.gitPush();
    if (result.success) {
      toast("Changes pushed successfully", "success");
    } else {
      toast(result.error || "Failed to push changes", "error");
    }
  }, [daemon, toast]);

  const handleGitPull = useCallback(async () => {
    const result = await daemon.gitPull();
    if (result.success) {
      toast("Changes pulled successfully", "success");
    } else {
      toast(result.error || "Failed to pull changes", "error");
    }
  }, [daemon, toast]);

  const handleRefreshGitStatus = useCallback(() => {
    void daemon.refreshGitStatus(true);
  }, [daemon]);

  const handleDiscardAll = useCallback(async () => {
    const result = await daemon.gitDiscardAll();
    if (result.success) {
      toast("All changes discarded", "success");
    } else {
      toast(result.error || "Failed to discard changes", "error");
    }
  }, [daemon, toast]);

  const handleDiscardFile = useCallback(async (path: string) => {
    const result = await daemon.gitDiscardFile(path);
    if (result.success) {
      toast(`Discarded changes: ${path}`, "success");
    } else {
      toast(result.error || "Failed to discard file", "error");
    }
  }, [daemon, toast]);

  const handlePublishToGitHub = useCallback(async () => {
    setGhPublishError(null);

    const status = await daemon.ghCheck();
    if (!status.installed) {
      toast(
        "GitHub CLI (gh) is not installed. Install it from https://cli.github.com",
        "error",
      );
      return;
    }

    if (!status.authenticated) {
      if (daemon.isAuthenticatingGh) {
        toast(
          "GitHub authentication is already in progress in the terminal window.",
          "info",
        );
        return;
      }

      toast(
        "Terminal opened for GitHub login. Complete prompts there (type Y when asked), then continue in browser.",
        "info",
      );
      const loginResult = await daemon.ghAuthLogin();
      if (!loginResult.success || !loginResult.authenticated) {
        toast(loginResult.error || "GitHub authentication failed", "error");
        return;
      }
      toast("Authenticated with GitHub", "success");
    }

    setShowGitHubPublishDialog(true);
  }, [daemon, toast]);

  const handleGitHubPublish = useCallback(
    async (name: string, isPrivate: boolean, description: string) => {
      setGhPublishError(null);
      const result = await daemon.ghCreateRepo(name, isPrivate, description || undefined);
      if (result.success) {
        setShowGitHubPublishDialog(false);
        toast(`Repository published: ${result.url}`, "success");
      } else {
        setGhPublishError(result.error || "Failed to create repository");
      }
    },
    [daemon, toast],
  );

  const runOpenCodePrompt = useCallback(
    async (prompt: string): Promise<string> => {
      if (!daemon.projectPath) {
        throw new Error("Project path is missing");
      }

      const baseUrl = `http://localhost:${opencodePort}`;
      const query = `?directory=${encodeURIComponent(daemon.projectPath)}`;
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        "x-opencode-directory": encodeURIComponent(daemon.projectPath),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AI_COMMIT_TIMEOUT_MS);
      let sessionId: string | null = null;

      try {
        const createSessionResponse = await fetch(`${baseUrl}/session${query}`, {
          method: "POST",
          headers,
          body: JSON.stringify({}),
          signal: controller.signal,
        });

        if (!createSessionResponse.ok) {
          const errorText = await createSessionResponse.text().catch(() => "");
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
        const initialText = extractTextParts(messageData?.parts).join("\n").trim();
        if (initialText) {
          return initialText;
        }

        const parentMessageId =
          messageData?.info?.role === "user" ? messageData.info.id : undefined;
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
              ? (messagesData as { messages: OpenCodeMessageItem[] }).messages
              : [];

          for (let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            const info = item?.info;
            if (!info || info.role !== "assistant") continue;
            if (parentMessageId && info.parentID && info.parentID !== parentMessageId) {
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
    [daemon.projectPath, opencodePort],
  );

  const handleGenerateCommitMessageAI = useCallback(async () => {
    if (!daemon.projectPath) {
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
        const started = await startOpencode(daemon.projectPath);
        if (!started) {
          toast("Failed to start OpenCode daemon.", "error");
          return;
        }
      }

      const diffChunks = await Promise.all(
        stagedChanges.map((change) => daemon.gitDiff(change.path, true)),
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
    daemon,
    stagedChanges,
    checkOpencodeStatus,
    startOpencode,
    runOpenCodePrompt,
    toast,
  ]);

  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) return;
    const result = await daemon.gitCommit(commitMessage.trim());
    if (result.success) {
      toast("Changes committed", "success");
      setCommitMessage("");
      setShowCommitInput(false);
    } else {
      toast(result.error || "Failed to commit", "error");
    }
  }, [commitMessage, daemon, toast]);

  const validateFileName = useCallback((name: string): string | null => {
    if (!name.trim()) {
      return "Name cannot be empty";
    }
    if (name.includes("/") || name.includes("\\")) {
      return "Name cannot contain / or \\";
    }
    if (name.startsWith(".")) {
      return "Name cannot start with .";
    }
    return null;
  }, []);

  const handleCreateConfirm = useCallback(
    async (value: string) => {
      if (!createDialog) return;
      try {
        if (createDialog.type === "file") {
          await daemon.createFile(value);
        } else {
          await daemon.createDirectory(value);
        }
        setCreateDialog(null);
      } catch (error) {
        toast(`Failed to create: ${error}`, "error");
      }
    },
    [createDialog, daemon, toast],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (isMod && key === "o" && !e.shiftKey) {
        e.preventDefault();
        handleOpenFolder();
        return;
      }

      if (isMod && key === "w" && !e.shiftKey) {
        e.preventDefault();
        if (selectedFile) {
          handleCloseTab(selectedFile);
        }
        return;
      }

      // Compile with AI: Cmd/Ctrl+Shift+B
      if (isMod && e.shiftKey && key === "b") {
        e.preventDefault();
        if (daemon.projectPath) {
          handleCompileWithDetection();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [daemon, handleOpenFolder, selectedFile, handleCloseTab, handleCompileWithDetection]);

  const isShowingGitDiff =
    editorViewMode === "git-diff" &&
    !!gitDiffPreview &&
    selectedFile === gitDiffPreview.path;

  const parsedGitDiff = useMemo(() => {
    if (!gitDiffPreview?.content) return null;
    return parseUnifiedDiffContent(gitDiffPreview.content);
  }, [gitDiffPreview?.content]);

  const primaryEditorPaneContent = (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      {selectedFile && (
        <TabBar
          tabs={editorTabs}
          activeTab={selectedFile}
          onTabSelect={handleFileSelect}
          onTabClose={handleCloseTab}
          onTabReorder={handleReorderTabs}
          onTabDragMove={handleEditorTabDragMove}
          onTabDragEnd={handleEditorTabDragEnd}
          onCloseOthers={handleCloseOtherTabs}
          onCloseToLeft={handleCloseTabsToLeft}
          onCloseToRight={handleCloseTabsToRight}
          onCloseAll={handleCloseAllTabs}
          variant="editor"
        />
      )}

      {selectedFile ? (
        isShowingGitDiff ? (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="border-b border-border bg-accent-hover px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {gitDiffPreview.path}
                </div>
                <div className="text-xs text-muted flex items-center gap-2">
                  <span>
                    {gitDiffPreview.staged
                      ? "Staged changes"
                      : "Working tree changes"}
                  </span>
                  {parsedGitDiff && parsedGitDiff.hasRenderableHunks && (
                    <span>
                      +{parsedGitDiff.added} / -{parsedGitDiff.removed}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    void loadGitDiffPreview(gitDiffPreview.path, gitDiffPreview.staged)
                  }
                  className="btn btn-sm btn-secondary"
                >
                  Refresh Diff
                </button>
                <button
                  onClick={() => {
                    void handleFileSelect(gitDiffPreview.path);
                  }}
                  className="btn btn-sm btn-secondary"
                >
                  Open File
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              {gitDiffPreview.isLoading ? (
                <EditorSkeleton className="h-full" />
              ) : gitDiffPreview.error ? (
                <div className="h-full flex items-center justify-center px-6 text-sm text-muted">
                  Failed to load diff: {gitDiffPreview.error}
                </div>
              ) : parsedGitDiff?.isBinary ? (
                <div className="h-full flex items-center justify-center px-6 text-sm text-muted">
                  Binary file diff is not previewable in editor.
                </div>
              ) : !gitDiffPreview.content.trim() ? (
                <div className="h-full flex items-center justify-center px-6 text-sm text-muted">
                  No textual diff available for this file.
                </div>
              ) : parsedGitDiff && parsedGitDiff.hasRenderableHunks ? (
                <GitMonacoDiffEditor
                  original={parsedGitDiff.original}
                  modified={parsedGitDiff.modified}
                  filePath={gitDiffPreview.path}
                  className="h-full"
                />
              ) : (
                <MonacoEditor
                  content={gitDiffPreview.content}
                  readOnly
                  onContentChange={() => {}}
                  language="diff"
                  editorSettings={editorSettings.settings}
                  editorTheme={editorSettings.editorTheme}
                  className="h-full"
                />
              )}
            </div>
          </div>
        ) : binaryPreviewUrl ? (
          <div className="flex-1 flex flex-col bg-accent-hover overflow-hidden">
            {getFileType(selectedFile) === "pdf" && (
              <div className="flex items-center justify-end px-2 py-1 border-b border-border bg-surface-secondary">
                <button
                  onClick={() => setPdfRefreshKey((k) => k + 1)}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted hover:text-foreground hover:bg-surface-tertiary rounded transition-colors"
                  title="Refresh PDF"
                >
                  <ArrowClockwiseIcon className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>
            )}
            <div className="flex-1 flex items-center justify-center overflow-auto p-4">
              {getFileType(selectedFile) === "image" ? (
                <img
                  src={binaryPreviewUrl}
                  alt={selectedFile}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <iframe
                  key={pdfRefreshKey}
                  src={binaryPreviewUrl}
                  className="w-full h-full border-0"
                  title={`PDF: ${selectedFile}`}
                />
              )}
            </div>
          </div>
        ) : isLoadingFile ? (
          <EditorSkeleton className="flex-1 min-h-0" />
        ) : (
          <motion.div
            key={selectedFile}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex-1 min-h-0"
          >
            <EditorErrorBoundary>
              <MonacoEditor
                content={fileContent}
                readOnly={false}
                onContentChange={handleContentChange}
                language={getFileLanguage(selectedFile)}
                editorSettings={editorSettings.settings}
                editorTheme={editorSettings.editorTheme}
                className="h-full"
              />
            </EditorErrorBoundary>
          </motion.div>
        )
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center px-6 text-sm text-muted bg-accent-hover">
          Drop a tab here to open this panel.
        </div>
      )}
    </div>
  );

  const editorPanelItems: DockviewPanelItem[] = [];
  if (selectedFile || openTabs.length > 0) {
    editorPanelItems.push({
      id: "editor-primary",
      title: selectedFile ? pathSync.basename(selectedFile) : "Editor",
      content: primaryEditorPaneContent,
      inactive: false,
    });
  }
  if (splitPane) {
    editorPanelItems.push({
      id: `editor-split-${splitPane.side}`,
      title: splitPane.selectedFile
        ? pathSync.basename(splitPane.selectedFile)
        : "Split",
      content: renderSplitPane(splitPane.side),
      inactive: true,
      position: {
        referencePanel: "editor-primary",
        direction: splitPane.side,
      },
    });
  }

  return (
    <div className="h-dvh flex flex-col">
      <div className="flex-shrink-0 flex flex-col">
        <header
          className="h-12 border-b border-border flex items-center"
        >
          <div className="w-full px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => {
                  import("@tauri-apps/plugin-shell").then(({ open }) => {
                    open("https://writer.lmms-lab.com");
                  });
                }}
                className="hover:opacity-70 transition-opacity flex items-center"
                title="Visit writer.lmms-lab.com"
                aria-label="Open LMMs-Lab website"
              >
                <img
                  src="/logo-small-light.svg"
                  alt="LMMs-Lab Writer"
                  className="h-7 w-auto dark:hidden"
                />
                <img
                  src="/logo-small-dark.svg"
                  alt="LMMs-Lab Writer"
                  className="h-7 w-auto hidden dark:block"
                />
              </button>
              <span className="text-border">/</span>
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-sm font-medium px-2 py-1 -ml-2 truncate">
                  {daemon.projectPath
                    ? pathSync.basename(daemon.projectPath)
                    : "LMMs-Lab Writer"}
                </div>
                {isSaving && (
                  <span className="text-xs text-muted shrink-0">Saving...</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 h-8">
              {daemon.projectPath && (
                <button
                  onClick={() => setShowSidebar((prev) => !prev)}
                  className={`h-8 w-8 border border-border transition-colors flex items-center justify-center bg-background text-foreground ${
                    showSidebar
                      ? "border-foreground"
                      : "hover:bg-accent-hover hover:border-border-dark"
                  }`}
                  title="Toggle Sidebar"
                >
                  <SidebarSimpleIcon className="size-4" weight="bold" />
                </button>
              )}

              {daemon.projectPath && (
                <button
                  onClick={() => setShowTerminal((prev) => !prev)}
                  className={`h-8 w-8 border border-border transition-colors flex items-center justify-center bg-background text-foreground ${
                    showTerminal
                      ? "border-foreground"
                      : "hover:bg-accent-hover hover:border-border-dark"
                  }`}
                  title="Toggle Terminal"
                >
                  <TerminalIcon className="size-4" weight="bold" />
                </button>
              )}

              <button
                onClick={handleToggleRightPanel}
                className={`h-8 w-8 border border-border transition-colors flex items-center justify-center bg-background text-foreground ${
                  showRightPanel
                    ? "border-foreground"
                    : "hover:bg-accent-hover hover:border-border-dark"
                }`}
                title="Toggle Agent Mode"
              >
                <RobotIcon className="size-4" weight="bold" />
              </button>

              {daemon.projectPath && (
                <>
                  <span className="text-border text-lg select-none">/</span>
                  <div className="flex items-center gap-2 h-8">
                    <button
                      onClick={handleCompileWithDetection}
                      disabled={latexSettings.isDetecting}
                      className={`h-8 w-8 border border-border transition-colors flex items-center justify-center bg-background text-foreground ${
                        latexSettings.isDetecting
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-accent-hover hover:border-border-dark"
                      }`}
                      title="Compile (Ctrl+Shift+B)"
                    >
                      <PlayCircleIcon className="size-4" />
                    </button>

                    <button
                      onClick={() => setShowLatexSettings(true)}
                      className="h-8 w-8 border border-border bg-background text-foreground hover:bg-accent-hover hover:border-border-dark transition-colors flex items-center justify-center"
                      title="LaTeX Settings"
                      aria-label="LaTeX Settings"
                    >
                      <GearIcon className="size-4" />
                    </button>
                  </div>
                </>
              )}

              {!auth.loading && (
                <>
                  <span className="text-border text-lg select-none">/</span>
                  {auth.profile ? (
                    <UserDropdown profile={auth.profile} />
                  ) : (
                    <button
                      onClick={() => {
                        setShowLoginCodeModal(true);
                      }}
                      className="h-8 px-3 text-sm border-2 border-foreground bg-background text-foreground shadow-[3px_3px_0_0_var(--foreground)] hover:shadow-[1px_1px_0_0_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center"
                    >
                      Login
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </header>
      </div>

      <main className="flex-1 min-h-0 flex relative overflow-hidden">
        <AnimatePresence mode="wait">
          {showSidebar && (
            <motion.div
              key="sidebar-container"
              initial={
                prefersReducedMotion ? { opacity: 1 } : { x: -280, opacity: 0 }
              }
              animate={{ x: 0, opacity: 1 }}
              exit={
                prefersReducedMotion ? { opacity: 0 } : { x: -280, opacity: 0 }
              }
              transition={
                prefersReducedMotion ? INSTANT_TRANSITION : PANEL_SPRING
              }
              className="flex flex-shrink-0"
              style={{
                willChange: prefersReducedMotion
                  ? undefined
                  : "transform, opacity",
              }}
            >
              <aside
                style={{
                  width:
                    resizing === "sidebar"
                      ? "var(--sidebar-width)"
                      : sidebarWidth,
                  willChange: resizing === "sidebar" ? "width" : undefined,
                }}
                className="border-r border-border flex flex-col flex-shrink-0 overflow-hidden"
              >
                <TabBar
                  tabs={sidebarTabs}
                  activeTab={sidebarTab}
                  onTabSelect={(id) => setSidebarTab(id as "files" | "git")}
                  variant="sidebar"
                />

                {sidebarTab === "files" && (
                  <FileSidebarPanel
                    projectPath={daemon.projectPath}
                    files={daemon.files}
                    selectedFile={selectedFile}
                    highlightedFile={highlightedFile}
                    onFileSelect={handleFileSelect}
                    onCreateFile={() => setCreateDialog({ type: "file" })}
                    onCreateDirectory={() => setCreateDialog({ type: "directory" })}
                    onRefreshFiles={daemon.refreshFiles}
                    fileOperations={{
                      createFile: daemon.createFile,
                      createDirectory: daemon.createDirectory,
                      renamePath: daemon.renamePath,
                      deletePath: daemon.deletePath,
                    }}
                  />
                )}

                {sidebarTab === "git" && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <GitSidebarPanel
                      projectPath={daemon.projectPath}
                      gitStatus={gitStatus}
                      gitGraph={daemon.gitGraph}
                      gitLogEntries={daemon.gitLogEntries}
                      stagedChanges={stagedChanges}
                      unstagedChanges={unstagedChanges}
                      showRemoteInput={showRemoteInput}
                      remoteUrl={remoteUrl}
                      onRemoteUrlChange={(value) => setRemoteUrl(value)}
                      onShowRemoteInput={() => setShowRemoteInput(true)}
                      onHideRemoteInput={() => setShowRemoteInput(false)}
                      onSubmitRemote={handleRemoteSubmit}
                      onInitGit={daemon.gitInit}
                      isInitializingGit={daemon.isInitializingGit}
                      onRefreshStatus={handleRefreshGitStatus}
                      onStageAll={handleStageAll}
                      onDiscardAll={handleDiscardAll}
                      onDiscardFile={handleDiscardFile}
                      onStageFile={handleStageFile}
                      onUnstageFile={handleUnstageFile}
                      onUnstageAll={handleUnstageAll}
                      showCommitInput={showCommitInput}
                      commitMessage={commitMessage}
                      onCommitMessageChange={(value) => setCommitMessage(value)}
                      onShowCommitInput={() => setShowCommitInput(true)}
                      onHideCommitInput={() => setShowCommitInput(false)}
                      onCommit={handleCommit}
                      onPush={handleGitPush}
                      onPull={handleGitPull}
                      onPreviewDiff={handlePreviewGitDiff}
                      onGenerateCommitMessageAI={handleGenerateCommitMessageAI}
                      onOpenFile={(path) => {
                        void handleFileSelect(path);
                      }}
                      onPublishToGitHub={handlePublishToGitHub}
                      isGeneratingCommitMessageAI={isGeneratingCommitMessageAI}
                      isPushing={daemon.isPushing}
                      isPulling={daemon.isPulling}
                      isAuthenticatingGh={daemon.isAuthenticatingGh}
                    />
                  </div>
                )}
              </aside>
              <div className="relative group w-1 flex-shrink-0">
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0}
                  dragMomentum={false}
                  onDragStart={() => startResize("sidebar")}
                  onDrag={(event, info) =>
                    handleResizeDrag("sidebar", info)
                  }
                  onDragEnd={endResize}
                  className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize z-10"
                  style={{ x: 0 }}
                />
                <div
                  className={`w-full h-full transition-colors ${resizing === "sidebar" ? "bg-foreground/20" : "group-hover:bg-foreground/20"}`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0 w-0 flex flex-col overflow-hidden">
          {daemon.projectPath && editorPanelItems.length > 0 ? (
            <div
              ref={editorWorkspaceRef}
              className="relative flex-1 min-h-0"
            >
              {splitDropHint && (
                <div className="pointer-events-none absolute inset-0 z-10">
                  <div
                    className={`absolute inset-y-0 w-1/2 transition-opacity duration-100 ${
                      splitDropHint === "left"
                        ? "left-0 border-r border-accent/40 bg-gradient-to-r from-foreground/15 to-transparent shadow-[inset_-20px_0_24px_-20px_rgba(0,0,0,0.45)]"
                        : "right-0 border-l border-accent/40 bg-gradient-to-l from-foreground/15 to-transparent shadow-[inset_20px_0_24px_-20px_rgba(0,0,0,0.45)]"
                    }`}
                  />
                </div>
              )}

              <DockviewPanelLayout
                panels={editorPanelItems}
                className="dockview-editor-layout"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {daemon.projectPath ? (
                <div />
              ) : (
                <div className="flex flex-col items-center justify-center text-center px-6">
                  <img
                    src="/logo-light.svg"
                    alt="LMMs-Lab Writer"
                    className="h-24 w-auto mb-10 dark:hidden"
                  />
                  <img
                    src="/logo-dark.svg"
                    alt="LMMs-Lab Writer"
                    className="h-24 w-auto mb-10 hidden dark:block"
                  />
                  <button
                    onClick={handleOpenFolder}
                    className="btn btn-primary"
                  >
                    Open Folder
                  </button>
                  <RecentProjects
                    projects={recentProjects.projects}
                    onSelect={handleOpenRecentProject}
                    onRemove={recentProjects.removeProject}
                    onClearAll={recentProjects.clearAll}
                  />
                </div>
              )}
            </div>
          )}

          {/* LaTeX Install Prompt - shown when no compiler is detected */}
          {daemon.projectPath &&
            latexCompiler.compilersStatus &&
            !hasAnyCompiler &&
            !latexCompiler.isDetecting && (
              <div className="border-t border-border">
                <LaTeXInstallPrompt
                  onRefreshCompilers={latexCompiler.detectCompilers}
                />
              </div>
            )}

          <AnimatePresence>
            {daemon.projectPath && showTerminal && (
              <motion.div
                key="terminal-container"
                initial={
                  prefersReducedMotion
                    ? { opacity: 1, height: 0 }
                    : { opacity: 0, height: 0 }
                }
                animate={{
                  opacity: 1,
                  height:
                    resizing === "bottom"
                      ? "var(--terminal-height)"
                      : terminalHeight,
                }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0, height: 0 }
                    : { opacity: 0, height: 0 }
                }
                transition={
                  prefersReducedMotion ? INSTANT_TRANSITION : PANEL_SPRING
                }
                className="flex-shrink-0 border-t border-border flex flex-col overflow-hidden"
                style={{
                  willChange: prefersReducedMotion ? undefined : "height, opacity",
                }}
              >
                <div className="relative group h-1 flex-shrink-0">
                  <motion.div
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0}
                    dragMomentum={false}
                    onDragStart={() => startResize("bottom")}
                    onDrag={(event, info) =>
                      handleResizeDrag("bottom", info)
                    }
                    onDragEnd={endResize}
                    className="absolute inset-x-0 -top-1 -bottom-1 cursor-row-resize z-10"
                    style={{ y: 0 }}
                  />
                  <div
                    className={`w-full h-full transition-colors ${resizing === "bottom" ? "bg-foreground/20" : "group-hover:bg-foreground/20"}`}
                  />
                </div>
                <EditorTerminal
                  projectPath={daemon.projectPath ?? undefined}
                  shellMode={editorSettings.settings.terminalShellMode}
                  customShell={editorSettings.settings.terminalShellPath}
                  className="flex-1 min-h-0"
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        <AnimatePresence>
          {showRightPanel && (
            <motion.div
              key="right-panel-container"
              initial={
                prefersReducedMotion
                  ? { opacity: 1, width: 0 }
                  : { opacity: 0, width: 0 }
              }
              animate={{
                opacity: 1,
                width:
                  resizing === "right"
                    ? `calc(var(--right-panel-width) + 4px)`
                    : rightPanelWidth + 4,
              }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0, width: 0 }
                  : { opacity: 0, width: 0 }
              }
              transition={
                prefersReducedMotion ? INSTANT_TRANSITION : PANEL_SPRING
              }
              className="flex flex-shrink-0 bg-background overflow-hidden"
              style={{
                willChange: prefersReducedMotion ? undefined : "width, opacity",
              }}
            >
              <div className="relative group w-1 flex-shrink-0">
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0}
                  dragMomentum={false}
                  onDragStart={() => startResize("right")}
                  onDrag={(event, info) => handleResizeDrag("right", info)}
                  onDragEnd={endResize}
                  className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize z-10"
                  style={{ x: 0 }}
                />
                <div
                  className={`w-full h-full transition-colors ${resizing === "right" ? "bg-foreground/20" : "group-hover:bg-foreground/20"}`}
                />
              </div>
              <aside
                style={{
                  width:
                    resizing === "right"
                      ? "var(--right-panel-width)"
                      : rightPanelWidth,
                  willChange: resizing === "right" ? "width" : undefined,
                }}
                className="border-l border-border flex flex-col flex-shrink-0 overflow-hidden"
              >
                <OpenCodeErrorBoundary onReset={restartOpencode}>
                  <OpenCodePanel
                    className="h-full"
                    baseUrl={`http://localhost:${opencodePort}`}
                    directory={daemon.projectPath ?? undefined}
                    autoConnect={
                      opencodeDaemonStatus === "running" && !!daemon.projectPath
                    }
                    daemonStatus={opencodeDaemonStatus}
                    onRestartOpenCode={restartOpencode}
                    onMaxReconnectFailed={handleMaxReconnectFailed}
                    onFileClick={handleFileSelect}
                    pendingMessage={pendingOpenCodeMessage}
                    onPendingMessageSent={() => setPendingOpenCodeMessage(null)}
                  />
                </OpenCodeErrorBoundary>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <OpenCodeDisconnectedDialog
        open={showDisconnectedDialog}
        onClose={handleCloseDisconnectedDialog}
        onRestart={handleRestartFromDialog}
      />

      <OpenCodeErrorDialog
        open={!!opencodeError}
        error={opencodeError ?? ""}
        onClose={handleCloseErrorDialog}
        onRetry={restartOpencode}
        onKillPort={handleKillPort}
      />

      {createDialog && (
        <InputDialog
          title={createDialog.type === "file" ? "New File" : "New Folder"}
          placeholder={createDialog.type === "file" ? "file.tex" : "folder"}
          onConfirm={handleCreateConfirm}
          onCancel={() => setCreateDialog(null)}
          validator={validateFileName}
        />
      )}

      <LaTeXSettingsDialog
        open={showLatexSettings}
        onClose={() => setShowLatexSettings(false)}
        settings={latexSettings.settings}
        onUpdateSettings={latexSettings.updateSettings}
        editorSettings={editorSettings.settings}
        onUpdateEditorSettings={editorSettings.updateSettings}
        texFiles={texFiles}
      />

      {mainFileDetectionResult && (
        <MainFileSelectionDialog
          open={showMainFileDialog}
          detectionResult={mainFileDetectionResult}
          onSelect={handleMainFileSelect}
          onCancel={handleMainFileDialogCancel}
        />
      )}

      {showGitHubPublishDialog && (
        <GitHubPublishDialog
          defaultRepoName={
            daemon.projectPath
              ? pathSync.basename(daemon.projectPath)
              : "my-project"
          }
          onPublish={handleGitHubPublish}
          onCancel={() => {
            setShowGitHubPublishDialog(false);
            setGhPublishError(null);
          }}
          isCreating={daemon.isCreatingRepo}
          error={ghPublishError}
        />
      )}

      <LoginCodeModal
        isOpen={showLoginCodeModal}
        onClose={() => setShowLoginCodeModal(false)}
        onSuccess={async (accessToken) => {
          if (accessToken) {
            // Session storage failed, use access token directly
            await auth.setAuthWithToken(accessToken);
          } else {
            // Session was stored properly, refresh normally
            await auth.refreshAuth();
          }
        }}
      />
    </div>
  );
}

function OpenCodePanelSkeleton() {
  return (
    <div className="flex flex-col bg-background h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="size-2 bg-surface-tertiary animate-pulse" />
          <div className="h-4 w-24 bg-surface-tertiary animate-pulse" />
        </div>
        <div className="h-6 w-12 bg-surface-tertiary animate-pulse" />
      </div>
      <div className="flex-1 p-3 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div
              className="h-4 bg-surface-secondary animate-pulse"
              style={{ width: `${60 + i * 10}%` }}
            />
            <div
              className="h-4 bg-surface-secondary animate-pulse"
              style={{ width: `${40 + i * 10}%` }}
            />
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3">
        <div className="h-16 bg-accent-hover border border-border animate-pulse" />
      </div>
    </div>
  );
}
