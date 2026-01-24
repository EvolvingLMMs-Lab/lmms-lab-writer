"use client";

import { CollaborativeEditorLazy } from "@/components/editor/collaborative-editor-loader";
import { FileTree } from "@/components/editor/file-tree";
import { InstallGuide } from "@/components/install-guide";
import { ShareModal } from "@/components/sharing/share-modal";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useDaemon } from "@/lib/daemon";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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

  const [title, setTitle] = useState(document.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>();
  const [fileContent, setFileContent] = useState<string>("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfUrl] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(224);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [resizing, setResizing] = useState<"sidebar" | "right" | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"files" | "git">("files");
  const [rightTab, setRightTab] = useState<"compile" | "terminal">("compile");

  // Git state from daemon
  const gitStatus = daemon.gitStatus;

  // Commit state
  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitInput, setShowCommitInput] = useState(false);

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

  const handleFileSelect = useCallback(
    async (path: string) => {
      setSelectedFile(path);
      const content = await daemon.readFile(path);
      if (content !== null) {
        setFileContent(content);
      }
    },
    [daemon],
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
      const handle = await (window as unknown as { showDirectoryPicker: (opts: { mode: string }) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({ mode: "readwrite" });
      // Get the path - this is a bit hacky but works
      const path = await getDirectoryPath(handle);
      if (path) {
        daemon.setProject(path);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Failed to open folder:", err);
      }
    }
  }, [daemon]);

  // Helper to get directory path (works via daemon)
  const getDirectoryPath = async (handle: FileSystemDirectoryHandle): Promise<string | null> => {
    // For security reasons, browsers don't expose the full path
    // We'll use the directory name and let the user confirm
    const name = handle.name;

    // Prompt user to enter the path since browsers don't expose full paths
    const userPath = prompt(
      `Enter the full path to "${name}":\n\nExample: /Users/yourname/Documents/${name}`,
      `${name}`
    );
    return userPath;
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
      <header className="border-b border-border flex-shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              aria-label="Back to dashboard"
              className="text-muted hover:text-black transition-colors"
            >
              <svg
                className="w-5 h-5"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={1.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={role === "viewer"}
              className="text-lg font-medium bg-transparent border-0 focus:outline-none focus:ring-0 w-auto min-w-[200px] disabled:opacity-50"
              placeholder="Untitled Document"
            />
            {isSaving && <span className="text-xs text-muted">Saving...</span>}
          </div>

          <div className="flex items-center gap-4">
            {/* Compile button */}
            <button
              onClick={handleCompile}
              disabled={daemon.isCompiling || !daemon.projectPath}
              className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-sm hover:bg-black/80 active:bg-black/60 transition-colors disabled:opacity-50"
            >
              {daemon.isCompiling ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Compiling...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Compile
                </>
              )}
            </button>

            <button
              onClick={() => setShowSidebar((v) => !v)}
              className={`p-1 transition-colors ${showSidebar ? "text-black" : "text-muted hover:text-black"}`}
              title={showSidebar ? "Hide sidebar" : "Show sidebar"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <button
              onClick={() => setShowPdf((v) => !v)}
              className={`p-1 transition-colors ${showPdf ? "text-black" : "text-muted hover:text-black"}`}
              title={showPdf ? "Hide PDF" : "Show PDF"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>

            <div className="w-px h-5 bg-border" />

            {/* Connection status */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span className="size-2 bg-green-500 rounded-full" />
              Connected
            </div>

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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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
                      <div className="px-3 py-2 border-b border-border text-xs text-muted truncate" title={daemon.projectPath}>
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
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                      <button
                        onClick={handleOpenFolder}
                        className="px-4 py-2 bg-black text-white text-sm hover:bg-black/80 active:bg-black/60 transition-colors"
                      >
                        Open Folder
                      </button>
                      <p className="mt-3 text-xs text-muted max-w-[180px]">
                        Select your LaTeX project folder to start editing
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Git tab */}
              {sidebarTab === "git" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {!daemon.projectPath ? (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted p-4 text-center">
                      Open a folder first
                    </div>
                  ) : !gitStatus?.isRepo ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-sm text-muted mb-4">Not a git repository</p>
                      <button
                        onClick={() => daemon.gitInit()}
                        className="px-4 py-2 bg-black text-white text-sm hover:bg-black/80 active:bg-black/60 transition-colors"
                      >
                        Initialize Git
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Branch info */}
                      <div className="px-3 py-2 border-b border-border bg-neutral-50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{gitStatus.branch}</span>
                          <button
                            onClick={() => daemon.refreshGitStatus()}
                            className="text-muted hover:text-black"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>
                        {(gitStatus.ahead > 0 || gitStatus.behind > 0) && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                            {gitStatus.ahead > 0 && <span>{gitStatus.ahead} ahead</span>}
                            {gitStatus.behind > 0 && <span>{gitStatus.behind} behind</span>}
                          </div>
                        )}
                      </div>

                      {/* Changes */}
                      <div className="flex-1 overflow-auto">
                        {stagedChanges.length > 0 && (
                          <div className="border-b border-border">
                            <div className="px-3 py-1 bg-neutral-50 text-xs font-medium uppercase tracking-wider text-muted">
                              Staged ({stagedChanges.length})
                            </div>
                            {stagedChanges.map((c) => (
                              <div key={c.path} className="px-3 py-1 text-sm flex items-center gap-2">
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
                              <button onClick={handleStageAll} className="text-black hover:underline normal-case tracking-normal font-normal">
                                Stage all
                              </button>
                            </div>
                            {unstagedChanges.map((c) => (
                              <div key={c.path} className="px-3 py-1 text-sm flex items-center gap-2 group">
                                <span className="font-mono text-xs text-muted">
                                  {c.status[0]?.toUpperCase()}
                                </span>
                                <span className="truncate flex-1">{c.path}</span>
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
                      </div>

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
                              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                handleCommit();
                              }
                            }}
                          />
                          <div className="flex justify-between">
                            <button onClick={() => setShowCommitInput(false)} className="text-xs text-muted">
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
                            Commit (<span className="tabular-nums">{stagedChanges.length}</span>)
                          </button>
                        )}
                        {gitStatus.ahead > 0 && (
                          <button
                            onClick={() => daemon.gitPush()}
                            className="flex-1 px-3 py-1.5 border border-border text-xs hover:border-black active:bg-neutral-100 transition-colors"
                          >
                            Push (<span className="tabular-nums">{gitStatus.ahead}</span>)
                          </button>
                        )}
                        {gitStatus.behind > 0 && (
                          <button
                            onClick={() => daemon.gitPull()}
                            className="flex-1 px-3 py-1.5 border border-border text-xs hover:border-black active:bg-neutral-100 transition-colors"
                          >
                            Pull (<span className="tabular-nums">{gitStatus.behind}</span>)
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
          {daemon.projectPath && selectedFile ? (
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
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted">
              {daemon.projectPath ? (
                <p>Select a file to edit</p>
              ) : (
                <div className="text-center space-y-4">
                  <p>Open a folder to start editing</p>
                  <button
                    onClick={handleOpenFolder}
                    className="px-4 py-2 bg-black text-white text-sm hover:bg-black/80 active:bg-black/60 transition-colors"
                  >
                    Open Folder
                  </button>
                  <p className="text-xs max-w-md">
                    Works with Claude Code, OpenCode, Codex, and any AI coding
                    assistant that can edit files directly.
                  </p>
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
              </div>

              {rightTab === "compile" && (
                <div className="flex-1 overflow-auto p-3 font-mono text-xs bg-neutral-50">
                  {daemon.compileOutput || (
                    <span className="text-muted">
                      Click Compile to build your document
                    </span>
                  )}
                </div>
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
    </div>
  );
}
