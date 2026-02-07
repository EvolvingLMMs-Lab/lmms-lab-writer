"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTauriDaemon } from "@/lib/tauri";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { InputDialog } from "@/components/ui/input-dialog";
import { TabBar, TabItem } from "@/components/ui/tab-bar";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import { EditorErrorBoundary } from "@/components/editor/editor-error-boundary";
import { FileSidebarPanel } from "@/components/editor/sidebar-file-panel";
import { GitSidebarPanel } from "@/components/editor/sidebar-git-panel";
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

const MonacoEditor = dynamic(
  () =>
    import("@/components/editor/monaco-editor").then((mod) => mod.MonacoEditor),
  { ssr: false },
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

const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL || "https://writer.lmms-lab.com";

const MIN_PANEL_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 480;

export default function EditorPage() {
  const daemon = useTauriDaemon();
  const prefersReducedMotion = useReducedMotion();
  const auth = useAuth();
  const { toast } = useToast();
  const recentProjects = useRecentProjects();

  const [selectedFile, setSelectedFile] = useState<string>();
  const [fileContent, setFileContent] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [binaryPreviewUrl, setBinaryPreviewUrl] = useState<string | null>(null);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
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
  const [resizing, setResizing] = useState<"sidebar" | "right" | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"files" | "git">("files");
  const [highlightedFile, _setHighlightedFile] = useState<string | null>(null);

  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitInput, setShowCommitInput] = useState(false);
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

  const contentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const opencodeStartedForPathRef = useRef<string | null>(null);
  const savingVisualTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<{ path: string; time: number } | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // RAF-based resize refs for 60fps performance
  const sidebarWidthRef = useRef(sidebarWidth);
  const rightPanelWidthRef = useRef(rightPanelWidth);
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
  const editorSettings = useEditorSettings();
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
    checkOpencodeStatus();
  }, [checkOpencodeStatus]);

  useEffect(() => {
    if (!daemon.projectPath) {
      opencodeStartedForPathRef.current = null;
    }
  }, [daemon.projectPath]);

  // Listen for opencode logs from Tauri backend
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<{ type: string; message: string }>("opencode-log", (event) => {
        const { type, message } = event.payload;
        if (type === "stderr") {
          console.error("[OpenCode]", message);
        } else {
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
    (panel: "sidebar" | "right") => {
      setResizing(panel);
      sidebarWidthRef.current = sidebarWidth;
      rightPanelWidthRef.current = rightPanelWidth;
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${sidebarWidth}px`,
      );
      document.documentElement.style.setProperty(
        "--right-panel-width",
        `${rightPanelWidth}px`,
      );
    },
    [sidebarWidth, rightPanelWidth],
  );

  const handleResizeDrag = useCallback((panel: "sidebar" | "right", info: PanInfo) => {
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
      } else {
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
    document.documentElement.style.removeProperty("--sidebar-width");
    document.documentElement.style.removeProperty("--right-panel-width");
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

  const handleFileSelect = useCallback(
    async (path: string) => {
      const fileType = getFileType(path);

      setOpenTabs((prev) => {
        if (prev.includes(path)) return prev;
        return [...prev, path];
      });
      setSelectedFile(path);
      setBinaryPreviewUrl(null);

      if (fileType === "text") {
        setIsLoadingFile(true);
        try {
          const content = await daemon.readFile(path);
          setFileContent(content ?? "");
        } catch (err) {
          const errorStr = String(err);

          // Handle file not found - remove from tabs and notify user
          if (errorStr.includes("FILE_NOT_FOUND")) {
            const fileName = pathSync.basename(path);
            toast(
              `File "${fileName}" no longer exists and has been removed from tabs`,
              "error",
            );

            // Remove the file from open tabs
            setOpenTabs((prev) => {
              const newTabs = prev.filter((p) => p !== path);

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
          ? pathSync.join(daemon.projectPath, path)
          : path;
        setBinaryPreviewUrl(convertFileSrc(fullPath));
        setFileContent("");
      }
    },
    [daemon, getFileType, toast],
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
    }
  }, [daemon.lastFileChange, selectedFile, handleFileSelect, daemon]);

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
  }, []);

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

  return (
    <div className="h-dvh flex flex-col">
      <header className="border-b border-border flex-shrink-0 h-[72px] flex items-center">
        <div className="w-full px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                import("@tauri-apps/plugin-shell").then(({ open }) => {
                  open("https://writer.lmms-lab.com");
                });
              }}
              className="logo-bar text-foreground hover:opacity-70 transition-opacity"
              title="Visit writer.lmms-lab.com"
              aria-label="Open LMMs-Lab website"
            >
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
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
            <button
              onClick={handleToggleRightPanel}
              className={`h-8 px-3 text-sm border border-border transition-colors flex items-center gap-2 font-medium bg-white text-black ${
                showRightPanel
                  ? "border-black"
                  : "hover:bg-neutral-50 hover:border-neutral-400"
              }`}
            >
              Agent Mode
            </button>

            {daemon.projectPath && (
              <>
                <span className="text-neutral-300 text-lg select-none">/</span>
                <div className="flex items-center gap-2 h-8">
                  <button
                    onClick={handleCompileWithDetection}
                    disabled={latexSettings.isDetecting}
                    className={`h-8 w-8 border border-border transition-colors flex items-center justify-center bg-white text-black ${
                      latexSettings.isDetecting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-neutral-50 hover:border-neutral-400"
                    }`}
                    title="Compile (Ctrl+Shift+B)"
                  >
                    <PlayCircleIcon className="size-4" />
                  </button>

                  <button
                    onClick={() => setShowLatexSettings(true)}
                    className="h-8 w-8 border border-border bg-white text-black hover:bg-neutral-50 hover:border-neutral-400 transition-colors flex items-center justify-center"
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
                <span className="text-neutral-300 text-lg select-none">/</span>
                {auth.profile ? (
                  <UserDropdown profile={auth.profile} />
                ) : (
                  <button
                    onClick={() => {
                      setShowLoginCodeModal(true);
                    }}
                    className="h-8 px-3 text-sm border-2 border-black bg-white text-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center"
                  >
                    Login
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

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
                      onRefreshStatus={daemon.refreshGitStatus}
                      onStageAll={handleStageAll}
                      onStageFile={handleStageFile}
                      showCommitInput={showCommitInput}
                      commitMessage={commitMessage}
                      onCommitMessageChange={(value) => setCommitMessage(value)}
                      onShowCommitInput={() => setShowCommitInput(true)}
                      onHideCommitInput={() => setShowCommitInput(false)}
                      onCommit={handleCommit}
                      onPush={handleGitPush}
                      onPull={handleGitPull}
                      isPushing={daemon.isPushing}
                      isPulling={daemon.isPulling}
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
                  className={`w-full h-full transition-colors ${resizing === "sidebar" ? "bg-black/20" : "group-hover:bg-black/20"}`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0 w-0 flex flex-col overflow-hidden">
          {selectedFile && (
            <TabBar
              tabs={editorTabs}
              activeTab={selectedFile}
              onTabSelect={handleFileSelect}
              onTabClose={handleCloseTab}
              onCloseOthers={handleCloseOtherTabs}
              onCloseToLeft={handleCloseTabsToLeft}
              onCloseToRight={handleCloseTabsToRight}
              onCloseAll={handleCloseAllTabs}
              variant="editor"
            />
          )}
          {daemon.projectPath && selectedFile ? (
            binaryPreviewUrl ? (
              <div className="flex-1 flex flex-col bg-neutral-50 overflow-hidden">
                {getFileType(selectedFile) === "pdf" && (
                  <div className="flex items-center justify-end px-2 py-1 border-b border-neutral-200 bg-neutral-100">
                    <button
                      onClick={() => setPdfRefreshKey((k) => k + 1)}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded transition-colors"
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
                    className="h-full"
                  />
                </EditorErrorBoundary>
              </motion.div>
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {daemon.projectPath ? (
                <div />
              ) : (
                <div className="flex flex-col items-center justify-center text-center px-6">
                  <h2 className="text-2xl font-bold tracking-tight mb-3 text-black">
                    Open a LaTeX Project
                  </h2>
                  <p className="text-muted text-sm mb-8 leading-relaxed max-w-sm">
                    Select a folder containing your .tex files to start editing.
                  </p>
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
              className="flex flex-shrink-0 bg-white overflow-hidden"
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
                  className={`w-full h-full transition-colors ${resizing === "right" ? "bg-black/20" : "group-hover:bg-black/20"}`}
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
    <div className="flex flex-col bg-white h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="size-2 bg-neutral-200 animate-pulse" />
          <div className="h-4 w-24 bg-neutral-200 animate-pulse" />
        </div>
        <div className="h-6 w-12 bg-neutral-200 animate-pulse" />
      </div>
      <div className="flex-1 p-3 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div
              className="h-4 bg-neutral-100 animate-pulse"
              style={{ width: `${60 + i * 10}%` }}
            />
            <div
              className="h-4 bg-neutral-100 animate-pulse"
              style={{ width: `${40 + i * 10}%` }}
            />
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3">
        <div className="h-16 bg-neutral-50 border border-border animate-pulse" />
      </div>
    </div>
  );
}
