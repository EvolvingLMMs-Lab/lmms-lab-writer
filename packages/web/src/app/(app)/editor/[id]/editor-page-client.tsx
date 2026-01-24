"use client";

import { CollaborativeEditorLazy } from "@/components/editor/collaborative-editor-loader";
import { FileTree } from "@/components/editor/file-tree";
import { InstallGuide } from "@/components/install-guide";
import { ShareModal } from "@/components/sharing/share-modal";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDaemon } from "@/lib/daemon";
import { useOpenCodeDetection } from "@/lib/opencode";
import { createClient } from "@/lib/supabase/client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const OpenCodePanelLazy = dynamic(
  () =>
    import("@/components/opencode/opencode-panel").then(
      (mod) => mod.OpenCodePanel,
    ),
  { ssr: false },
);

type Document = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
};

type Props = {
  document: Document;
  userId: string;
  userName: string;
  role: "owner" | "editor" | "viewer";
};

export function EditorPageClient({ document, userId, userName, role }: Props) {
  const router = useRouter();
  const daemon = useDaemon();
  const openCodeStatus = useOpenCodeDetection({ enabled: true });

  const [title, setTitle] = useState(document.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>();
  const [fileContent, setFileContent] = useState<string>("");
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [binaryPreviewUrl, setBinaryPreviewUrl] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return 224;
    const saved = localStorage.getItem("alw-sidebar-width");
    return saved ? Number(saved) : 224;
  });
  const [rightPanelWidth, setRightPanelWidth] = useState(() => {
    if (typeof window === "undefined") return 400;
    const saved = localStorage.getItem("alw-right-panel-width");
    return saved ? Number(saved) : 400;
  });
  const [resizing, setResizing] = useState<"sidebar" | "right" | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"files" | "git">("files");
  const [rightTab, setRightTab] = useState<"compile" | "terminal" | "opencode">(
    "compile",
  );
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showQuickOpen, setShowQuickOpen] = useState(false);
  const [quickOpenQuery, setQuickOpenQuery] = useState("");

  // Git state from daemon
  const gitStatus = daemon.gitStatus;

  // Commit state
  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitInput, setShowCommitInput] = useState(false);

  // Remote state
  const [showRemoteInput, setShowRemoteInput] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState("");

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingTitleRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const contentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveTitleToDb = useCallback(
    async (newTitle: string, skipStateUpdate = false) => {
      if (!skipStateUpdate) setIsSaving(true);
      const supabase = createClient();
      await supabase
        .from("documents")
        .update({ title: newTitle })
        .eq("id", document.id);
      if (!skipStateUpdate && isMountedRef.current) setIsSaving(false);
    },
    [document.id],
  );

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      if (role === "viewer") return;

      setTitle(newTitle);
      pendingTitleRef.current = newTitle;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        if (pendingTitleRef.current !== null) {
          saveTitleToDb(pendingTitleRef.current);
          pendingTitleRef.current = null;
        }
      }, 300);
    },
    [role, saveTitleToDb],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        if (pendingTitleRef.current !== null) {
          saveTitleToDb(pendingTitleRef.current, true);
        }
      }
    };
  }, [saveTitleToDb]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (selectedFile && fileContent) {
        e.preventDefault();
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [selectedFile, fileContent]);

  // Auto-connect to saved project path for this document
  useEffect(() => {
    if (!daemon.connected || daemon.projectPath) return;

    const savedPath = localStorage.getItem(`alw-doc-path-${document.id}`);
    if (savedPath) {
      daemon.setProject(savedPath);
    }
  }, [daemon.connected, daemon.projectPath, daemon, document.id]);

  const prevResizingRef = useRef<"sidebar" | "right" | null>(null);

  useEffect(() => {
    if (prevResizingRef.current === "sidebar" && resizing === null) {
      localStorage.setItem("alw-sidebar-width", String(sidebarWidth));
    } else if (prevResizingRef.current === "right" && resizing === null) {
      localStorage.setItem("alw-right-panel-width", String(rightPanelWidth));
    }
    prevResizingRef.current = resizing;
  }, [resizing, sidebarWidth, rightPanelWidth]);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (resizing === "sidebar") {
        setSidebarWidth(Math.min(Math.max(e.clientX, 150), 400));
      } else if (resizing === "right") {
        setRightPanelWidth(
          Math.min(Math.max(window.innerWidth - e.clientX, 300), 600),
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
        const content = await daemon.readFile(path);
        setFileContent(content ?? "");
      } else {
        setBinaryPreviewUrl(
          `http://localhost:3002/${encodeURIComponent(path)}`,
        );
        setFileContent("");
      }
    },
    [daemon, getFileType],
  );

  // Safety: ensure selectedFile is always in openTabs
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
        // If closing the selected file, switch to another tab
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

      if (contentSaveTimeoutRef.current) {
        clearTimeout(contentSaveTimeoutRef.current);
      }

      contentSaveTimeoutRef.current = setTimeout(() => {
        if (selectedFile) {
          daemon.writeFile(selectedFile, content);
        }
      }, 500);
    },
    [selectedFile, daemon],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (role !== "owner") return;

    const supabase = createClient();
    await supabase.from("documents").delete().eq("id", document.id);

    router.push("/dashboard");
  }, [document.id, role, router]);

  const handleOpenFolder = useCallback(async () => {
    if (!("showDirectoryPicker" in window)) {
      alert("Please use Chrome or Edge to open folders");
      return;
    }

    try {
      const handle = await (
        window as unknown as {
          showDirectoryPicker: (opts: {
            mode: string;
          }) => Promise<FileSystemDirectoryHandle>;
        }
      ).showDirectoryPicker({ mode: "readwrite" });
      // Get the path - this is a bit hacky but works
      const path = await getDirectoryPath(handle);
      if (path) {
        daemon.setProject(path);
        // Save path association for this document
        localStorage.setItem(`alw-doc-path-${document.id}`, path);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Failed to open folder:", err);
      }
    }
  }, [daemon, document.id]);

  // Helper to get directory path (works via daemon)
  const getDirectoryPath = async (
    handle: FileSystemDirectoryHandle,
  ): Promise<string | null> => {
    // For security reasons, browsers don't expose the full path
    // We'll use the directory name and let the user confirm
    const name = handle.name;

    // Try to get last used base path from localStorage
    const lastBasePath = localStorage.getItem("alw-base-path") || "~/Github";
    const guessedPath = `${lastBasePath}/${name}`;

    // Ask user to confirm the path
    const confirmed = confirm(
      `Open folder at:\n\n${guessedPath}\n\nClick OK to confirm, or Cancel to enter a different path.`,
    );

    if (confirmed) {
      return guessedPath;
    }

    // If not confirmed, let user enter custom path
    const customPath = prompt(`Enter the full path to "${name}":`, guessedPath);

    // Save the base path for next time
    if (customPath) {
      const basePath = customPath.substring(0, customPath.lastIndexOf("/"));
      if (basePath) {
        localStorage.setItem("alw-base-path", basePath);
      }
    }

    return customPath;
  };

  const handleCompile = useCallback(() => {
    daemon.compile();
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

      if (isMod) {
        const editorCommands = [
          "z",
          "x",
          "c",
          "v",
          "a",
          "f",
          "d",
          "y",
          "/",
          "l",
          "g",
          "[",
          "]",
        ];
        if (editorCommands.includes(key) && !e.shiftKey && key !== "g") return;
        if (key === "z" && e.shiftKey) return;
        if (e.shiftKey && ["k", "d", "l"].includes(key)) return;
        if (e.altKey && ["ArrowUp", "ArrowDown"].includes(e.key)) return;
      }

      if (isMod && key === "s" && !e.shiftKey) {
        e.preventDefault();
        return;
      }

      if (isMod && key === "b" && !e.shiftKey) {
        e.preventDefault();
        setShowSidebar((v) => !v);
        return;
      }

      if (isMod && e.key === "\\") {
        e.preventDefault();
        setShowPdf((v) => !v);
        return;
      }

      if (isMod && e.shiftKey && key === "e") {
        e.preventDefault();
        setShowSidebar(true);
        setSidebarTab("files");
        return;
      }

      if (isMod && e.shiftKey && key === "g") {
        e.preventDefault();
        setShowSidebar(true);
        setSidebarTab("git");
        return;
      }

      if (isMod && e.shiftKey && key === "b") {
        e.preventDefault();
        if (daemon.projectPath && !daemon.isCompiling) {
          daemon.compile();
        }
        return;
      }

      if (isMod && key === "o" && !e.shiftKey) {
        e.preventDefault();
        handleOpenFolder();
        return;
      }

      if (isMod && key === "p" && !e.shiftKey) {
        e.preventDefault();
        setShowQuickOpen(true);
        setQuickOpenQuery("");
        return;
      }

      if (isMod && key === "k" && !e.shiftKey) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (e.key === "Escape") {
        if (showShortcuts) {
          setShowShortcuts(false);
          e.preventDefault();
          return;
        }
        if (showQuickOpen) {
          setShowQuickOpen(false);
          e.preventDefault();
          return;
        }
      }

      if (isMod && key === "w" && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (selectedFile) {
          handleCloseTab(selectedFile);
        }
        return false;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [
    daemon,
    handleOpenFolder,
    selectedFile,
    showShortcuts,
    showQuickOpen,
    handleCloseTab,
  ]);

  const userColors = [
    "#000000",
    "#333333",
    "#666666",
    "#999999",
    "#1a1a1a",
    "#2a2a2a",
    "#3a3a3a",
    "#4a4a4a",
  ];
  const userColor =
    userColors[userId.charCodeAt(0) % userColors.length] ?? "#000000";

  // Show install guide if daemon is not connected
  if (!daemon.connected) {
    return <InstallGuide />;
  }

  const stagedChanges = gitStatus?.changes.filter((c) => c.staged) ?? [];
  const unstagedChanges = gitStatus?.changes.filter((c) => !c.staged) ?? [];

  return (
    <div className="h-dvh flex flex-col">
      <header className="border-b border-border flex-shrink-0 h-[72px] flex items-center">
        <div className="w-full px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo - Home */}
            <Link
              href="/"
              aria-label="Home"
              className="hover:opacity-70 transition-opacity shrink-0"
            >
              <div className="logo-bar text-foreground">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </Link>
            <span className="text-border">/</span>
            {/* Back to Dashboard */}
            <Link
              href="/dashboard"
              className="text-sm text-muted hover:text-black transition-colors shrink-0"
            >
              Dashboard
            </Link>
            <span className="text-border">/</span>
            {/* Document Title */}
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={role === "viewer"}
                className="text-sm font-medium bg-transparent border-0 focus:outline-none focus:ring-0 min-w-0 max-w-[300px] disabled:opacity-50 hover:bg-neutral-100 focus:bg-neutral-100 px-2 py-1 -ml-2 transition-colors truncate"
                placeholder="Untitled Document"
              />
              {isSaving && (
                <span className="text-xs text-muted shrink-0">Saving...</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleCompile}
              disabled={daemon.isCompiling || !daemon.projectPath}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow:
                  "0 1px 0 1px rgba(0,0,0,0.04), 0 2px 0 rgba(0,0,0,0.06), inset 0 -1px 0 rgba(0,0,0,0.04)",
              }}
            >
              {daemon.isCompiling ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Compiling...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Compile
                </>
              )}
            </button>

            <button
              onClick={() => setShowSidebar((v) => !v)}
              aria-label={showSidebar ? "Hide sidebar" : "Show sidebar"}
              className={`p-1 ${showSidebar ? "text-black" : "text-muted hover:text-black"}`}
            >
              <svg
                className="size-5"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>
            <button
              onClick={() => setShowPdf((v) => !v)}
              aria-label={showPdf ? "Hide PDF preview" : "Show PDF preview"}
              className={`p-1 ${showPdf ? "text-black" : "text-muted hover:text-black"}`}
            >
              <svg
                className="size-5"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={1.5}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </button>

            <div className="w-px h-5 bg-border" />

            {/* Connection status */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="size-2 bg-green-500 rounded-full" />
              Connected
            </div>

            {/* Feedback link */}
            <a
              href="https://github.com/EvolvingLMMs-Lab/agentic-latex-writer/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Send feedback"
              className="flex items-center gap-1 text-xs text-muted hover:text-black"
            >
              <svg
                className="size-4"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Feedback
            </a>

            <button
              onClick={() => setShowShortcuts(true)}
              className="hover:opacity-70 transition-opacity"
              title="Keyboard Shortcuts (⌘K)"
            >
              <kbd>⌘ K</kbd>
            </button>
            {role !== "owner" && (
              <span className="text-xs uppercase tracking-wider text-muted border border-border px-2 py-1">
                {role}
              </span>
            )}
            {role === "owner" && (
              <>
                <button
                  onClick={() => setIsShareOpen(true)}
                  className="text-sm text-muted hover:text-black active:text-black/70 transition-colors flex items-center gap-1"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      strokeWidth={1.5}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  Share
                </button>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-sm text-muted hover:text-black active:text-black/70 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex">
        {showSidebar && (
          <>
            <aside
              style={{ width: sidebarWidth }}
              className="border-r border-border flex flex-col flex-shrink-0"
            >
              {/* Sidebar tabs */}
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

              {/* Files tab */}
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
                        onFileSelect={handleFileSelect}
                        className="flex-1"
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
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      <p className="text-xs">No folder open</p>
                    </div>
                  )}
                </>
              )}

              {/* Git tab */}
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
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      <p className="text-xs">No folder open</p>
                    </div>
                  ) : !gitStatus?.isRepo ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                      <svg
                        className="w-8 h-8 mb-3 text-muted opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <p className="text-xs font-medium mb-1">
                        Not a git repository
                      </p>
                      <p className="text-xs text-muted mb-3 max-w-[200px]">
                        Initialize git to track local version history
                      </p>
                      {daemon.gitInitResult?.error && (
                        <p className="text-xs text-red-600 mb-3 max-w-[200px]">
                          {daemon.gitInitResult.error}
                        </p>
                      )}
                      <button
                        onClick={() => daemon.gitInit()}
                        disabled={daemon.isInitializingGit}
                        className="px-3 py-1.5 bg-black text-white text-xs hover:bg-black/80 active:bg-black/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {daemon.isInitializingGit ? (
                          <>
                            <svg
                              className="w-3 h-3 animate-spin"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Initializing...
                          </>
                        ) : (
                          "Initialize Git"
                        )}
                      </button>
                      <p className="text-xs text-muted mt-4 max-w-[200px] leading-relaxed">
                        Push to GitHub for multi-device sync and collaboration
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Branch info */}
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
                        {(gitStatus.ahead > 0 || gitStatus.behind > 0) && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                            {gitStatus.ahead > 0 && (
                              <span>{gitStatus.ahead} ahead</span>
                            )}
                            {gitStatus.behind > 0 && (
                              <span>{gitStatus.behind} behind</span>
                            )}
                          </div>
                        )}
                        {!gitStatus.remote && (
                          <div className="mt-2">
                            {showRemoteInput ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={remoteUrl}
                                  onChange={(e) => setRemoteUrl(e.target.value)}
                                  placeholder="https://github.com/user/repo.git"
                                  className="w-full px-2 py-1 text-xs border border-border focus:outline-none focus:border-black"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && remoteUrl.trim()) {
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
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if (remoteUrl.trim()) {
                                        daemon.gitAddRemote(remoteUrl.trim());
                                        setRemoteUrl("");
                                        setShowRemoteInput(false);
                                      }
                                    }}
                                    disabled={!remoteUrl.trim()}
                                    className="flex-1 px-2 py-1 bg-black text-white text-xs hover:bg-black/80 disabled:opacity-50"
                                  >
                                    Connect
                                  </button>
                                  <button
                                    onClick={() => setShowRemoteInput(false)}
                                    className="px-2 py-1 text-xs text-muted hover:text-black"
                                  >
                                    Cancel
                                  </button>
                                </div>
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

                      {/* Changes */}
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

                      {/* Commit input */}
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
                          <div className="flex justify-between">
                            <button
                              onClick={() => setShowCommitInput(false)}
                              className="text-xs text-muted"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleCommit}
                              disabled={!commitMessage.trim()}
                              className="px-3 py-1 bg-black text-white text-xs hover:bg-black/80 active:bg-black/60 transition-colors disabled:opacity-50"
                            >
                              Commit
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="border-t border-border p-3 flex items-center gap-2">
                        {stagedChanges.length > 0 && !showCommitInput && (
                          <button
                            onClick={() => setShowCommitInput(true)}
                            className="flex-1 px-3 py-1.5 bg-black text-white text-xs hover:bg-black/80 active:bg-black/60 transition-colors"
                          >
                            Commit (
                            <span className="tabular-nums">
                              {stagedChanges.length}
                            </span>
                            )
                          </button>
                        )}
                        {gitStatus.ahead > 0 && (
                          <button
                            onClick={() => daemon.gitPush()}
                            className="flex-1 px-3 py-1.5 border border-border text-xs hover:border-black active:bg-neutral-100 transition-colors"
                          >
                            Push (
                            <span className="tabular-nums">
                              {gitStatus.ahead}
                            </span>
                            )
                          </button>
                        )}
                        {gitStatus.behind > 0 && (
                          <button
                            onClick={() => daemon.gitPull()}
                            className="flex-1 px-3 py-1.5 border border-border text-xs hover:border-black active:bg-neutral-100 transition-colors"
                          >
                            Pull (
                            <span className="tabular-nums">
                              {gitStatus.behind}
                            </span>
                            )
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
          </>
        )}

        <div className="flex-1 min-w-0 flex flex-col">
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
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement!.innerHTML =
                        `
                        <div class="text-center text-muted">
                          <p class="mb-2">Cannot preview image</p>
                          <p class="text-xs">${selectedFile}</p>
                        </div>
                      `;
                    }}
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
              <CollaborativeEditorLazy
                documentId={document.id}
                userId={userId}
                userName={userName}
                userColor={userColor}
                content={fileContent}
                readOnly={role === "viewer"}
                onContentChange={handleContentChange}
                className="flex-1"
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
                <div className="text-center max-w-md px-6">
                  <div className="w-20 h-20 mx-auto mb-8 border-2 border-black flex items-center justify-center">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-light tracking-tight mb-3">
                    Open a LaTeX Project
                  </h2>
                  <p className="text-muted text-sm mb-8 leading-relaxed">
                    Select a folder containing your .tex files. Changes sync
                    automatically with your local filesystem.
                  </p>
                  <button
                    onClick={handleOpenFolder}
                    className="px-6 py-3 bg-black text-white hover:bg-black/80 active:bg-black/60 transition-colors"
                  >
                    Open Folder
                  </button>
                  <div className="mt-10 pt-8 border-t border-neutral-200">
                    <p className="text-xs text-muted uppercase tracking-wider mb-4">
                      Works with
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted">
                      <span className="px-3 py-1.5 border border-neutral-200">
                        Claude Code
                      </span>
                      <span className="px-3 py-1.5 border border-neutral-200">
                        OpenCode
                      </span>
                      <span className="px-3 py-1.5 border border-neutral-200">
                        Codex
                      </span>
                      <span className="px-3 py-1.5 border border-neutral-200">
                        Cursor
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {showPdf && (
          <>
            <div
              onMouseDown={() => setResizing("right")}
              className={`w-1 cursor-col-resize hover:bg-black/20 transition-colors ${resizing === "right" ? "bg-black/20" : ""}`}
            />
            <aside
              style={{ width: rightPanelWidth }}
              className="border-l border-border flex flex-col flex-shrink-0"
            >
              <div className="flex items-center border-b border-border">
                <button
                  onClick={() => setRightTab("compile")}
                  className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    rightTab === "compile"
                      ? "text-black border-b-2 border-black -mb-px"
                      : "text-muted hover:text-black"
                  }`}
                >
                  Output
                </button>
                <button
                  onClick={() => setRightTab("terminal")}
                  className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
                    rightTab === "terminal"
                      ? "text-black border-b-2 border-black -mb-px"
                      : "text-muted hover:text-black"
                  }`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setRightTab("opencode")}
                  className={`flex-1 px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                    rightTab === "opencode"
                      ? "text-black border-b-2 border-black -mb-px"
                      : "text-muted hover:text-black"
                  }`}
                >
                  <span
                    className={`size-1.5 ${openCodeStatus.available ? "bg-green-500" : "bg-muted"}`}
                    title={
                      openCodeStatus.available
                        ? "OpenCode server running"
                        : "OpenCode server not detected"
                    }
                  />
                  OpenCode
                </button>
              </div>

              {rightTab === "compile" && (
                <ScrollArea className="flex-1 p-3 font-mono text-xs bg-neutral-50">
                  {daemon.compileOutput || (
                    <span className="text-muted">
                      Click Compile to build your document
                    </span>
                  )}
                </ScrollArea>
              )}

              {rightTab === "terminal" && (
                <div className="flex-1 bg-neutral-100">
                  {pdfUrl ? (
                    <iframe
                      src={pdfUrl}
                      className="w-full h-full border-0"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted text-sm">
                      No PDF available
                    </div>
                  )}
                </div>
              )}

              {rightTab === "opencode" && (
                <OpenCodePanelLazy
                  className="flex-1"
                  directory={daemon.projectPath ?? undefined}
                  autoConnect={openCodeStatus.available}
                />
              )}
            </aside>
          </>
        )}

        {resizing && <div className="fixed inset-0 z-50 cursor-col-resize" />}
      </main>

      <ShareModal
        documentId={document.id}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <AlertDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete document"
        description="Are you sure you want to delete this document? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
      />

      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowShortcuts(false)}
        >
          <div className="absolute inset-0 bg-neutral-500/30" />
          <div
            className="relative bg-white border-2 border-black w-[560px] max-h-[80vh] overflow-hidden shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black">
              <h2 className="font-medium">Keyboard Shortcuts</h2>
              <kbd>ESC</kbd>
            </div>
            <ScrollArea className="max-h-[65vh]">
              <div className="p-5 space-y-6 text-sm">
                <div>
                  <div className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                    General
                  </div>
                  <div className="space-y-2">
                    {[
                      ["Show shortcuts", "⌘ ?"],
                      ["Quick open", "⌘ P"],
                      ["Save", "⌘ S"],
                      ["Open folder", "⌘ O"],
                      ["Close tab", "⌘ W"],
                    ].map(([label, key]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <span>{label}</span>
                        <kbd>{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                    Editing
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {[
                      ["Undo", "⌘ Z"],
                      ["Redo", "⇧ ⌘ Z"],
                      ["Cut", "⌘ X"],
                      ["Copy", "⌘ C"],
                      ["Paste", "⌘ V"],
                      ["Select all", "⌘ A"],
                      ["Find", "⌘ F"],
                      ["Comment", "⌘ /"],
                    ].map(([label, key]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <span>{label}</span>
                        <kbd>{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                    View
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                    {[
                      ["Sidebar", "⌘ B"],
                      ["PDF preview", "⌘ \\"],
                      ["Files", "⇧ ⌘ E"],
                      ["Git", "⇧ ⌘ G"],
                    ].map(([label, key]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between"
                      >
                        <span>{label}</span>
                        <kbd>{key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
                    Build
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Compile LaTeX</span>
                    <kbd>⇧ ⌘ B</kbd>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Quick Open (Cmd+K) */}
      {showQuickOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          onClick={() => setShowQuickOpen(false)}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative bg-white border-2 border-black w-[560px] max-h-[60vh] overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b-2 border-black">
              <svg
                className="size-4 ml-4 text-muted"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={quickOpenQuery}
                onChange={(e) => setQuickOpenQuery(e.target.value)}
                placeholder="Search files..."
                className="flex-1 px-3 py-3 border-0 focus:outline-none focus:ring-0 text-sm font-mono"
                autoFocus
              />
              <kbd className="mr-3 px-1.5 py-0.5 text-xs font-mono border border-border text-muted">
                ESC
              </kbd>
            </div>
            <ScrollArea className="max-h-[300px]">
              {daemon.files
                .filter((f) => f.type === "file")
                .filter((f) =>
                  quickOpenQuery
                    ? f.name
                        .toLowerCase()
                        .includes(quickOpenQuery.toLowerCase()) ||
                      f.path
                        .toLowerCase()
                        .includes(quickOpenQuery.toLowerCase())
                    : true,
                )
                .slice(0, 10)
                .map((file) => (
                  <button
                    key={file.path}
                    onClick={() => {
                      handleFileSelect(file.path);
                      setShowQuickOpen(false);
                      setQuickOpenQuery("");
                    }}
                    className="w-full px-4 py-2 text-left text-sm font-mono hover:bg-black hover:text-white flex items-center gap-3"
                  >
                    <svg
                      className="size-4 flex-shrink-0"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="square"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="truncate">{file.name}</span>
                    <span className="text-muted text-xs ml-auto truncate max-w-[200px]">
                      {file.path}
                    </span>
                  </button>
                ))}
              {daemon.files.filter((f) => f.type === "file").length === 0 && (
                <div className="px-4 py-8 text-center text-muted text-sm">
                  No files. Open a folder first.
                  <kbd className="ml-2 px-1.5 py-0.5 text-xs font-mono border border-border">
                    ⌘O
                  </kbd>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
