"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTauriDaemon } from "@/lib/tauri";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import { FileTree } from "@/components/editor/file-tree";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { EditorSkeleton } from "@/components/editor/editor-skeleton";
import { EditorErrorBoundary } from "@/components/editor/editor-error-boundary";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LoginForm, UserDropdown } from "@/components/auth";

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

const LaTeXEditor = dynamic(
  () =>
    import("@/components/editor/latex-editor").then((mod) => mod.LaTeXEditor),
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

const PANEL_SPRING = {
  type: "spring",
  stiffness: 400,
  damping: 35,
  mass: 0.8,
} as const;

const INSTANT_TRANSITION = { duration: 0 } as const;

export default function EditorPage() {
  const daemon = useTauriDaemon();
  const prefersReducedMotion = useReducedMotion();
  const auth = useAuth();
  const { toast } = useToast();

  const [selectedFile, setSelectedFile] = useState<string>();
  const [fileContent, setFileContent] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [binaryPreviewUrl, setBinaryPreviewUrl] = useState<string | null>(null);
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
  const [highlightedFile, setHighlightedFile] = useState<string | null>(null);

  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitInput, setShowCommitInput] = useState(false);
  const [showRemoteInput, setShowRemoteInput] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [opencodeDaemonStatus, setOpencodeDaemonStatus] =
    useState<OpenCodeDaemonStatus>("stopped");
  const [opencodePort, setOpencodePort] = useState(4096);
  const [showDisconnectedDialog, setShowDisconnectedDialog] = useState(false);

  const contentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const opencodeStartedForPathRef = useRef<string | null>(null);
  const savingVisualTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
    if (!daemon.projectPath || opencodeDaemonStatus === "unavailable") return;
    try {
      setOpencodeDaemonStatus("starting");
      const status = await invoke<OpenCodeStatus>("opencode_restart", {
        directory: daemon.projectPath,
      });
      setOpencodeDaemonStatus("running");
      setOpencodePort(status.port);
    } catch (err) {
      // console.error("Failed to restart OpenCode:", err);
      setOpencodeDaemonStatus("unavailable");
      toast(
        "Failed to restart OpenCode. Please check if it is installed correctly.",
        "error",
      );
    }
  }, [daemon.projectPath, opencodeDaemonStatus, toast]);

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

  // OpenCode is started manually when user clicks the right panel toggle
  useEffect(() => {
    if (!daemon.projectPath) {
      opencodeStartedForPathRef.current = null;
    }
  }, [daemon.projectPath]);

  useEffect(() => {
    if (!resizing) return;

    const MIN_PANEL_WIDTH = 200;
    const MAX_SIDEBAR_WIDTH = 480;

    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${sidebarWidth}px`,
    );
    document.documentElement.style.setProperty(
      "--right-panel-width",
      `${rightPanelWidth}px`,
    );

    const handleMouseMove = (e: MouseEvent) => {
      if (rafIdRef.current !== null) return;

      rafIdRef.current = requestAnimationFrame(() => {
        if (resizing === "sidebar") {
          const newWidth = Math.min(
            Math.max(e.clientX, MIN_PANEL_WIDTH),
            MAX_SIDEBAR_WIDTH,
          );
          sidebarWidthRef.current = newWidth;
          document.documentElement.style.setProperty(
            "--sidebar-width",
            `${newWidth}px`,
          );
        } else if (resizing === "right") {
          const maxRightWidth = Math.floor(window.innerWidth / 2);
          const newWidth = Math.min(
            Math.max(window.innerWidth - e.clientX, MIN_PANEL_WIDTH),
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
    };

    const handleMouseUp = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setSidebarWidth(sidebarWidthRef.current);
      setRightPanelWidth(rightPanelWidthRef.current);
      document.documentElement.style.removeProperty("--sidebar-width");
      document.documentElement.style.removeProperty("--right-panel-width");
      setResizing(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [resizing, sidebarWidth, rightPanelWidth]);

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
          console.error("Failed to read file:", err);
          setFileContent("");
        } finally {
          setIsLoadingFile(false);
        }
      } else {
        const fullPath = daemon.projectPath
          ? `${daemon.projectPath}/${path}`
          : path;
        setBinaryPreviewUrl(convertFileSrc(fullPath));
        setFileContent("");
      }
    },
    [daemon, getFileType],
  );

  useEffect(() => {
    if (selectedFile && !openTabs.includes(selectedFile)) {
      setOpenTabs((prev) => [...prev, selectedFile]);
    }
  }, [selectedFile, openTabs]);

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
    // Only run in Tauri environment
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
      console.warn("Tauri APIs not available in browser context");
      return;
    }
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select LaTeX Project",
      });

      if (selected && typeof selected === "string") {
        await daemon.setProject(selected);
        setShowSidebar(true);
        setShowRightPanel(true);
      }
    } catch (err) {
      console.error("Failed to open project:", err);
    }
  }, [daemon]);

  const handleStageAll = useCallback(() => {
    if (!gitStatus) return;
    const unstaged = gitStatus.changes
      .filter((c) => !c.staged)
      .map((c) => c.path);
    if (unstaged.length > 0) {
      daemon.gitAdd(unstaged);
    }
  }, [gitStatus, daemon]);

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
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [daemon, handleOpenFolder, selectedFile, handleCloseTab]);

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
                  ? daemon.projectPath.split("/").pop()
                  : "LMMs-Lab Writer"}
              </div>
              {isSaving && (
                <span className="text-xs text-muted shrink-0">Saving...</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleRightPanel}
              className={`btn btn-sm border-2 border-black transition-all flex items-center gap-2 bg-white text-black ${showRightPanel
                ? "shadow-none translate-x-[3px] translate-y-[3px]"
                : "shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px]"
                }`}
            >
              Agent Mode
            </button>

            {auth.isConfigured && !auth.loading && (
              <>
                {auth.profile ? (
                  <UserDropdown profile={auth.profile} />
                ) : (
                  <button
                    onClick={() => {
                      import("@tauri-apps/plugin-shell").then(({ open }) => {
                        open("https://writer.lmms-lab.com/login");
                      });
                    }}
                    className="btn btn-sm border-2 border-black bg-white text-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Login
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex">
        <AnimatePresence mode="wait">
          {showSidebar && (
            <motion.div
              key="sidebar-container"
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { x: -sidebarWidth, opacity: 0 }
              }
              animate={{ x: 0, opacity: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { x: -sidebarWidth, opacity: 0 }
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
                <div className="flex items-center border-b border-border">
                  <button
                    onClick={() => setSidebarTab("files")}
                    className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${sidebarTab === "files"
                      ? "text-black border-b-2 border-black -mb-px"
                      : "text-muted hover:text-black"
                      }`}
                  >
                    Files
                  </button>
                  <button
                    onClick={() => setSidebarTab("git")}
                    className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${sidebarTab === "git"
                      ? "text-black border-b-2 border-black -mb-px"
                      : "text-muted hover:text-black"
                      }`}
                  >
                    Git
                    {gitStatus && gitStatus.changes.length > 0 && (
                      <span className="ml-1 text-xs bg-neutral-200 px-1 tabular-nums">
                        {gitStatus.changes.length}
                      </span>
                    )}
                  </button>
                </div>

                {sidebarTab === "files" && (
                  <>
                    {daemon.projectPath ? (
                      <>
                        <div
                          className="px-3 py-2 border-b border-border text-xs text-muted truncate"
                          title={daemon.projectPath}
                        >
                          {daemon.projectPath.split("/").pop()}
                        </div>
                        <EditorErrorBoundary>
                          <FileTree
                            files={daemon.files}
                            selectedFile={selectedFile}
                            highlightedFile={highlightedFile}
                            onFileSelect={handleFileSelect}
                            className="flex-1 min-h-0 overflow-hidden"
                          />
                        </EditorErrorBoundary>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-muted">
                        <svg
                          className="w-8 h-8 mb-2 opacity-30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                            strokeWidth={1.5}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                        <p className="text-xs">No folder open</p>
                      </div>
                    )}
                  </>
                )}

                {sidebarTab === "git" && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {!daemon.projectPath ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-muted">
                        <svg
                          className="w-8 h-8 mb-2 opacity-30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                            strokeWidth={1.5}
                            d="M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9"
                          />
                        </svg>
                        <p className="text-xs">No folder open</p>
                      </div>
                    ) : !gitStatus?.isRepo ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-muted">
                        <svg
                          className="w-8 h-8 mb-2 opacity-30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="square"
                            strokeLinejoin="miter"
                            strokeWidth={1.5}
                            d="M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9"
                          />
                        </svg>
                        <p className="text-xs mb-3">Not a git repository</p>
                        <button
                          onClick={() => daemon.gitInit()}
                          disabled={daemon.isInitializingGit}
                          className="btn btn-sm btn-primary"
                        >
                          {daemon.isInitializingGit
                            ? "Initializing..."
                            : "Init Git"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="px-3 py-2 border-b border-border bg-neutral-50">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {gitStatus.branch}
                            </span>
                            <button
                              onClick={() => daemon.refreshGitStatus()}
                              className="text-muted hover:text-black"
                              aria-label="Refresh git status"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            </button>
                          </div>
                          {!gitStatus.remote && (
                            <div className="mt-2">
                              {showRemoteInput ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={remoteUrl}
                                    onChange={(e) =>
                                      setRemoteUrl(e.target.value)
                                    }
                                    placeholder="https://github.com/user/repo.git"
                                    className="w-full px-2 py-1 text-xs border border-border focus:outline-none focus:border-black"
                                    onKeyDown={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        remoteUrl.trim()
                                      ) {
                                        daemon.gitAddRemote(remoteUrl.trim());
                                        setRemoteUrl("");
                                        setShowRemoteInput(false);
                                      }
                                      if (e.key === "Escape") {
                                        setShowRemoteInput(false);
                                      }
                                    }}
                                    autoFocus
                                  />
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowRemoteInput(true)}
                                  className="text-xs text-black hover:underline"
                                >
                                  + Connect to GitHub
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <ScrollArea className="flex-1">
                          {stagedChanges.length > 0 && (
                            <div className="border-b border-border">
                              <div className="px-3 py-1 bg-neutral-50 text-xs font-medium uppercase tracking-wider text-muted">
                                Staged ({stagedChanges.length})
                              </div>
                              {stagedChanges.map((c) => (
                                <div
                                  key={c.path}
                                  className="px-3 py-1 text-sm flex items-center gap-2"
                                >
                                  <span className="font-mono text-xs text-green-700">
                                    {c.status[0]?.toUpperCase()}
                                  </span>
                                  <span className="truncate">{c.path}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {unstagedChanges.length > 0 && (
                            <div className="border-b border-border">
                              <div className="px-3 py-1 bg-neutral-50 text-xs font-medium uppercase tracking-wider text-muted flex justify-between">
                                <span>Changes ({unstagedChanges.length})</span>
                                <button
                                  onClick={handleStageAll}
                                  className="text-black hover:underline normal-case tracking-normal font-normal"
                                >
                                  Stage all
                                </button>
                              </div>
                              {unstagedChanges.map((c) => (
                                <div
                                  key={c.path}
                                  className="px-3 py-1 text-sm flex items-center gap-2 group"
                                >
                                  <span className="font-mono text-xs text-muted">
                                    {c.status[0]?.toUpperCase()}
                                  </span>
                                  <span className="truncate flex-1">
                                    {c.path}
                                  </span>
                                  <button
                                    onClick={() => daemon.gitAdd([c.path])}
                                    className="opacity-0 group-hover:opacity-100 text-xs"
                                    aria-label="Stage file"
                                  >
                                    +
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          {gitStatus.changes.length === 0 && (
                            <div className="px-3 py-8 text-center text-muted text-sm">
                              No changes
                            </div>
                          )}
                        </ScrollArea>

                        {showCommitInput && stagedChanges.length > 0 && (
                          <div className="border-t border-border p-3 space-y-2">
                            <textarea
                              value={commitMessage}
                              onChange={(e) => setCommitMessage(e.target.value)}
                              placeholder="Commit message..."
                              className="w-full px-2 py-1 text-sm border border-border resize-none focus:outline-none focus:border-black"
                              rows={2}
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  (e.metaKey || e.ctrlKey)
                                ) {
                                  handleCommit();
                                }
                              }}
                            />
                            <div className="flex justify-between items-center">
                              <button
                                onClick={() => setShowCommitInput(false)}
                                className="text-xs text-muted hover:text-black"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleCommit}
                                disabled={!commitMessage.trim()}
                                className="btn btn-sm btn-primary"
                              >
                                Commit
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="border-t border-border p-3 flex items-center gap-2">
                          {stagedChanges.length > 0 && !showCommitInput && (
                            <button
                              onClick={() => setShowCommitInput(true)}
                              className="btn btn-sm btn-primary flex-1"
                            >
                              Commit ({stagedChanges.length})
                            </button>
                          )}
                          {gitStatus.ahead > 0 && (
                            <button
                              onClick={async () => {
                                const result = await daemon.gitPush();
                                if (result.success) {
                                  toast(
                                    "Changes pushed successfully",
                                    "success",
                                  );
                                } else {
                                  toast(
                                    result.error || "Failed to push changes",
                                    "error",
                                  );
                                }
                              }}
                              disabled={daemon.isPushing}
                              className="btn btn-sm btn-secondary flex-1 flex items-center justify-center gap-1.5"
                            >
                              {daemon.isPushing ? (
                                <>
                                  <Spinner className="size-3" />
                                  <span>Pushing...</span>
                                </>
                              ) : (
                                `Push (${gitStatus.ahead})`
                              )}
                            </button>
                          )}
                          {gitStatus.behind > 0 && (
                            <button
                              onClick={async () => {
                                const result = await daemon.gitPull();
                                if (result.success) {
                                  toast(
                                    "Changes pulled successfully",
                                    "success",
                                  );
                                } else {
                                  toast(
                                    result.error || "Failed to pull changes",
                                    "error",
                                  );
                                }
                              }}
                              disabled={daemon.isPulling}
                              className="btn btn-sm btn-secondary flex-1 flex items-center justify-center gap-1.5"
                            >
                              {daemon.isPulling ? (
                                <>
                                  <Spinner className="size-3" />
                                  <span>Pulling...</span>
                                </>
                              ) : (
                                `Pull (${gitStatus.behind})`
                              )}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </aside>
              <div className="relative group w-1 flex-shrink-0">
                <div
                  onMouseDown={() => setResizing("sidebar")}
                  className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize z-10"
                />
                <div
                  className={`w-full h-full transition-colors ${resizing === "sidebar" ? "bg-black/20" : "group-hover:bg-black/20"}`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {selectedFile && (
            <div className="flex items-center border-b border-border bg-neutral-50 overflow-x-auto min-h-[34px]">
              {openTabs.map((tab) => {
                const fileName = tab.split("/").pop() || tab;
                const isActive = tab === selectedFile;
                return (
                  <div
                    key={tab}
                    className={`group flex items-center border-r border-border transition-colors ${
                      isActive
                        ? "bg-white text-black"
                        : "text-muted hover:text-black hover:bg-white/50"
                    }`}
                    title={tab}
                  >
                    <button
                      onClick={() => handleFileSelect(tab)}
                      className="px-3 py-1.5 text-sm truncate max-w-[120px]"
                    >
                      {fileName}
                    </button>
                    <button
                      onClick={(e) => handleCloseTab(tab, e)}
                      className={`w-6 h-full flex items-center justify-center hover:bg-neutral-200 ${
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                      aria-label="Close tab"
                    >
                      <svg
                        className="w-3 h-3"
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
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {daemon.projectPath && selectedFile ? (
            binaryPreviewUrl ? (
              <div className="flex-1 flex items-center justify-center bg-neutral-50 overflow-auto p-4">
                {getFileType(selectedFile) === "image" ? (
                  <img
                    src={binaryPreviewUrl}
                    alt={selectedFile}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={binaryPreviewUrl}
                    className="w-full h-full border-0"
                    title={`PDF: ${selectedFile}`}
                  />
                )}
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
                  <LaTeXEditor
                    content={fileContent}
                    readOnly={false}
                    onContentChange={handleContentChange}
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
                    className="btn btn-primary mb-8"
                  >
                    Open Folder
                  </button>

                  {auth.isConfigured && !auth.loading && !auth.profile && (
                    <div className="border-t border-border pt-8 w-full max-w-sm">
                      <p className="text-muted text-xs mb-6 uppercase tracking-wider">
                        Sign in for cloud features
                      </p>
                      <LoginForm />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showRightPanel && (
            <motion.div
              key="right-panel-container"
              initial={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { x: rightPanelWidth, opacity: 0 }
              }
              animate={{ x: 0, opacity: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { x: rightPanelWidth, opacity: 0 }
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
              <div className="relative group w-1 flex-shrink-0">
                <div
                  onMouseDown={() => setResizing("right")}
                  className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize z-10"
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
