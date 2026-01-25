"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTauriDaemon } from "@/lib/tauri";
import { FileTree } from "@/components/editor/file-tree";
import { ScrollArea } from "@/components/ui/scroll-area";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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
  { ssr: false },
);

const OpenCodeDisconnectedDialog = dynamic(
  () =>
    import("@/components/opencode/opencode-disconnected-dialog").then(
      (mod) => mod.OpenCodeDisconnectedDialog,
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

  const [selectedFile, setSelectedFile] = useState<string>();
  const [fileContent, setFileContent] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [binaryPreviewUrl, setBinaryPreviewUrl] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(280);
  const [resizing, setResizing] = useState<"sidebar" | "right" | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"files" | "git">("files");
  const [rightTab, setRightTab] = useState<"compile" | "opencode">("compile");
  const [highlightedFile, setHighlightedFile] = useState<string | null>(null);

  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitInput, setShowCommitInput] = useState(false);
  const [showRemoteInput, setShowRemoteInput] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [opencodeDaemonStatus, setOpencodeDaemonStatus] =
    useState<OpenCodeDaemonStatus>("stopped");
  const [opencodePort, setOpencodePort] = useState(4096);
  const [showDisconnectedDialog, setShowDisconnectedDialog] = useState(false);

  const contentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const opencodeStartedForPathRef = useRef<string | null>(null);

  const gitStatus = daemon.gitStatus;
  const stagedChanges = gitStatus?.changes.filter((c) => c.staged) ?? [];
  const unstagedChanges = gitStatus?.changes.filter((c) => !c.staged) ?? [];

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

  const startOpencode = useCallback(async (directory: string) => {
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
      setOpencodeDaemonStatus("stopped");
      return null;
    }
  }, []);

  const restartOpencode = useCallback(async () => {
    if (!daemon.projectPath) return;
    try {
      setOpencodeDaemonStatus("starting");
      const status = await invoke<OpenCodeStatus>("opencode_restart", {
        directory: daemon.projectPath,
      });
      setOpencodeDaemonStatus("running");
      setOpencodePort(status.port);
    } catch (err) {
      console.error("Failed to restart OpenCode:", err);
      setOpencodeDaemonStatus("stopped");
    }
  }, [daemon.projectPath]);

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

  useEffect(() => {
    if (!daemon.projectPath) {
      opencodeStartedForPathRef.current = null;
      return;
    }

    if (opencodeStartedForPathRef.current === daemon.projectPath) {
      return;
    }

    const initOpencode = async () => {
      const status = await checkOpencodeStatus();
      if (status?.installed && !status.running) {
        await startOpencode(daemon.projectPath!);
      } else if (status?.running) {
        opencodeStartedForPathRef.current = daemon.projectPath;
      }
    };

    initOpencode();
  }, [daemon.projectPath, checkOpencodeStatus, startOpencode]);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (resizing === "sidebar") {
        setSidebarWidth(Math.min(Math.max(e.clientX, 200), 400));
      } else if (resizing === "right") {
        setRightPanelWidth(
          Math.min(Math.max(window.innerWidth - e.clientX, 200), 400),
        );
      }
    };

    const handleMouseUp = () => setResizing(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  useEffect(() => {
    const COMPACT_THRESHOLD = 1100;

    const handleResize = () => {
      if (window.innerWidth < COMPACT_THRESHOLD) {
        setShowRightPanel(false);
      }
    };

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
        try {
          const content = await daemon.readFile(path);
          setFileContent(content ?? "");
        } catch (err) {
          console.error("Failed to read file:", err);
          setFileContent("");
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
      setIsSaving(true);

      if (contentSaveTimeoutRef.current) {
        clearTimeout(contentSaveTimeoutRef.current);
      }

      contentSaveTimeoutRef.current = setTimeout(async () => {
        if (selectedFile) {
          await daemon.writeFile(selectedFile, content);
          setIsSaving(false);
        }
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
        setShowSidebar(true);
        setShowRightPanel(true);
      }
    } catch (err) {
      console.error("Failed to open project:", err);
    }
  }, [daemon]);

  const handleCompile = useCallback(() => {
    setShowRightPanel(true);
    setRightTab("compile");
    daemon.compile(selectedFile);
  }, [daemon, selectedFile]);

  const handleStageAll = useCallback(() => {
    if (!gitStatus) return;
    const unstaged = gitStatus.changes
      .filter((c) => !c.staged)
      .map((c) => c.path);
    if (unstaged.length > 0) {
      daemon.gitAdd(unstaged);
    }
  }, [gitStatus, daemon]);

  const handleCommit = useCallback(() => {
    if (!commitMessage.trim()) return;
    daemon.gitCommit(commitMessage.trim());
    setCommitMessage("");
    setShowCommitInput(false);
  }, [commitMessage, daemon]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (isMod && key === "b" && !e.shiftKey) {
        e.preventDefault();
        setShowSidebar((v) => !v);
        return;
      }

      if (isMod && e.key === "\\") {
        e.preventDefault();
        setShowRightPanel((v) => !v);
        return;
      }

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

  useEffect(() => {
    if (daemon.compileSuccess && daemon.compilePdfPath && daemon.projectPath) {
      const relativePath = daemon.compilePdfPath.startsWith(daemon.projectPath)
        ? daemon.compilePdfPath.slice(daemon.projectPath.length + 1)
        : daemon.compilePdfPath;

      setHighlightedFile(relativePath);
      setShowSidebar(true);

      const timer = setTimeout(() => {
        setHighlightedFile(null);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [daemon.compileSuccess, daemon.compilePdfPath, daemon.projectPath]);

  return (
    <div className="h-dvh flex flex-col">
      <header className="border-b border-border flex-shrink-0 h-[72px] flex items-center">
        <div className="w-full px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={handleOpenFolder}
              className="logo-bar text-foreground hover:opacity-70 transition-opacity"
              title="Open Folder (⌘O)"
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

          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                onClick={() => setShowAgentMenu((v) => !v)}
                onBlur={() => setTimeout(() => setShowAgentMenu(false), 150)}
                className="btn btn-sm bg-white text-black border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
              >
                Agent Mode
                <svg
                  className={`w-3 h-3 transition-transform duration-100 ${showAgentMenu ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showAgentMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border-2 border-black z-50 shadow-[4px_4px_0_0_#000]">
                  <button
                    onClick={() => {
                      handleCompile();
                      setShowAgentMenu(false);
                    }}
                    disabled={daemon.isCompiling || !daemon.projectPath}
                    className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wide hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black flex justify-between items-center w-full transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {daemon.isCompiling && (
                        <svg
                          className="w-3 h-3 animate-spin"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                      Compile LaTeX
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowRightPanel(true);
                      setRightTab("opencode");
                      setShowAgentMenu(false);
                    }}
                    className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wide hover:bg-black hover:text-white w-full transition-colors"
                  >
                    OpenCode
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 pl-6 border-l border-border">
              <button
                onClick={() => setShowSidebar((v) => !v)}
                className={`p-2 transition-all border border-transparent hover:border-black ${showSidebar ? "bg-black text-white" : "text-muted hover:text-black"}`}
                title="Toggle Sidebar (⌘B)"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    d="M3 3h7v18H3V3zM10 3h11v18H10"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowRightPanel((v) => !v)}
                className={`p-2 transition-all border border-transparent hover:border-black ${showRightPanel ? "bg-black text-white" : "text-muted hover:text-black"}`}
                title="Toggle Right Panel (⌘\)"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    d="M14 3h7v18h-7V3zM3 3h11v18H3"
                  />
                </svg>
              </button>
            </div>
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
                style={{ width: sidebarWidth }}
                className="border-r border-border flex flex-col flex-shrink-0 overflow-hidden"
              >
                <div className="flex items-center border-b border-border">
                  <button
                    onClick={() => setSidebarTab("files")}
                    className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                      sidebarTab === "files"
                        ? "text-black border-b-2 border-black -mb-px"
                        : "text-muted hover:text-black"
                    }`}
                  >
                    Files
                  </button>
                  <button
                    onClick={() => setSidebarTab("git")}
                    className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                      sidebarTab === "git"
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
                        <FileTree
                          files={daemon.files}
                          selectedFile={selectedFile}
                          highlightedFile={highlightedFile}
                          onFileSelect={handleFileSelect}
                          className="flex-1 min-h-0 overflow-hidden"
                        />
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
                              onClick={() => daemon.gitPush()}
                              className="btn btn-sm btn-secondary flex-1"
                            >
                              Push ({gitStatus.ahead})
                            </button>
                          )}
                          {gitStatus.behind > 0 && (
                            <button
                              onClick={() => daemon.gitPull()}
                              className="btn btn-sm btn-secondary flex-1"
                            >
                              Pull ({gitStatus.behind})
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </aside>
              <div
                onMouseDown={() => setResizing("sidebar")}
                className={`w-1 cursor-col-resize hover:bg-black/20 transition-colors ${resizing === "sidebar" ? "bg-black/20" : ""}`}
              />
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
                  <button
                    key={tab}
                    onClick={() => handleFileSelect(tab)}
                    className={`group flex items-center gap-2 px-3 py-1.5 text-sm border-r border-border transition-colors ${
                      isActive
                        ? "bg-white text-black"
                        : "text-muted hover:text-black hover:bg-white/50"
                    }`}
                    title={tab}
                  >
                    <span className="truncate max-w-[120px]">{fileName}</span>
                    <span
                      onClick={(e) => handleCloseTab(tab, e)}
                      className={`w-4 h-4 flex items-center justify-center hover:bg-neutral-200 ${
                        isActive
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
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
                    </span>
                  </button>
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
            ) : (
              <LaTeXEditor
                content={fileContent}
                readOnly={false}
                onContentChange={handleContentChange}
                className="flex-1 min-h-0"
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              {daemon.projectPath ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 border-2 border-neutral-200 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-neutral-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-muted">Select a file from the sidebar</p>
                </div>
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
              <div
                onMouseDown={() => setResizing("right")}
                className={`w-1 cursor-col-resize hover:bg-black/20 transition-colors ${resizing === "right" ? "bg-black/20" : ""}`}
              />
              <aside
                style={{ width: rightPanelWidth }}
                className="border-l border-border flex flex-col flex-shrink-0 overflow-hidden"
              >
                <div className="flex items-center border-b border-border flex-shrink-0 bg-white">
                  <button
                    onClick={() => setRightTab("opencode")}
                    className={`group flex-1 flex items-center justify-center gap-1.5 h-9 px-3 text-[11px] font-mono font-medium transition-colors border-r border-border ${
                      rightTab === "opencode"
                        ? "text-black border-b-2 border-black -mb-px"
                        : "text-muted hover:text-black"
                    }`}
                  >
                    <div className="relative flex items-center">
                      <svg
                        className="size-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                          d="M12 8V4H8"
                        />
                        <rect
                          width="16"
                          height="12"
                          x="4"
                          y="8"
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                        />
                        <path
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                          d="M2 14h2"
                        />
                        <path
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                          d="M20 14h2"
                        />
                        <path
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                          d="M15 13v2"
                        />
                        <path
                          strokeLinecap="square"
                          strokeLinejoin="miter"
                          d="M9 13v2"
                        />
                      </svg>
                    </div>
                    Agent
                  </button>
                  <button
                    onClick={() => setRightTab("compile")}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-9 px-3 text-[11px] font-mono font-medium transition-colors ${
                      rightTab === "compile"
                        ? "text-black border-b-2 border-black -mb-px"
                        : "text-muted hover:text-black"
                    }`}
                  >
                    <svg
                      className="size-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline
                        points="4 17 10 11 4 5"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                      <line
                        x1="12"
                        y1="19"
                        x2="20"
                        y2="19"
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                    </svg>
                    Output
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                  {rightTab === "opencode" && (
                    <OpenCodePanel
                      className="h-full"
                      baseUrl={`http://localhost:${opencodePort}`}
                      directory={daemon.projectPath ?? undefined}
                      autoConnect={
                        opencodeDaemonStatus === "running" &&
                        !!daemon.projectPath
                      }
                      daemonStatus={opencodeDaemonStatus}
                      onRestartOpenCode={restartOpencode}
                      onMaxReconnectFailed={handleMaxReconnectFailed}
                    />
                  )}
                  {rightTab === "compile" && (
                    <ScrollArea className="flex-1 p-3 font-mono text-xs bg-neutral-50">
                      {daemon.compileOutput || (
                        <span className="text-muted">
                          Click Compile to build your document
                        </span>
                      )}
                    </ScrollArea>
                  )}
                </div>
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
