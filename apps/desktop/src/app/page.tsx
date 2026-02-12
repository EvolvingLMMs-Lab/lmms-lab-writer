"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { EditorErrorBoundary } from "@/components/editor/editor-error-boundary";
import {
  DockviewPanelLayout,
  type DockviewPanelItem,
} from "@/components/editor/dockview-panel-layout";
import { FileSidebarPanel } from "@/components/editor/sidebar-file-panel";
import { GitSidebarPanel } from "@/components/editor/sidebar-git-panel";
import { GitHubPublishDialog } from "@/components/editor/github-publish-dialog";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { UserDropdown, LoginCodeModal } from "@/components/auth";
import {
  useLatexSettings,
  useLatexCompiler,
  findTexFiles,
  findMainTexFile,
} from "@/lib/latex";
import { useEditorSettings } from "@/lib/editor";
import type {
  EditorViewMode,
  GitDiffPreviewState,
  SplitPaneSide,
  DragSourcePane,
  SplitPaneState,
} from "@/lib/editor/types";
import {
  LaTeXSettingsDialog,
  LaTeXInstallPrompt,
  MainFileSelectionDialog,
  SynctexInstallDialog,
} from "@/components/latex";
import { RecentProjects } from "@/components/recent-projects";
import { useRecentProjects } from "@/lib/recent-projects";
import { pathSync } from "@/lib/path";
import { COMPILE_PROMPT, type MainFileDetectionResult, type SynctexResult } from "@/lib/latex/types";
import {
  GearIcon,
  PlayCircleIcon,
  SidebarSimpleIcon,
  TerminalIcon,
  RobotIcon,
} from "@phosphor-icons/react";

// Extracted utilities
import {
  parseUnifiedDiffContent,
  buildBasenameIndex,
  getFileType,
  getFileLanguage,
  type TreeNode,
} from "@/lib/editor/file-utils";
import {
  PANEL_SPRING,
  INSTANT_TRANSITION,
  MonacoEditor,
  GitMonacoDiffEditor,
  EditorTerminal,
  OpenCodePanel,
  OpenCodeDisconnectedDialog,
  OpenCodeErrorBoundary,
  OpenCodeErrorDialog,
  PdfViewer,
} from "@/lib/editor/constants";

import { EditorSkeleton } from "@/components/editor/editor-skeleton";

// Extracted hooks
import { usePanelResize } from "@/lib/editor/use-panel-resize";
import { useKeyboardShortcuts } from "@/lib/editor/use-keyboard-shortcuts";
import { useProjectManagement } from "@/lib/editor/use-project-management";
import { useOpencodeDaemon } from "@/lib/opencode/use-opencode-daemon";
import { useGitOperations } from "@/lib/editor/use-git-operations";
import { useAiCommit } from "@/lib/opencode/use-ai-commit";

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

  // Extracted hooks
  const opencodeDaemon = useOpencodeDaemon({
    projectPath: daemon.projectPath,
    toast,
  });

  const panelResize = usePanelResize({
    onCompactResize: () => opencodeDaemon.setShowRightPanel(false),
  });

  const gitOps = useGitOperations({ daemon, toast });

  const projectMgmt = useProjectManagement({
    daemon,
    recentProjects,
    toast,
    onProjectOpen: () => {
      setShowSidebar(true);
      opencodeDaemon.setShowRightPanel(true);
    },
  });

  // Local state
  const [selectedFile, setSelectedFile] = useState<string>();
  const [fileContent, setFileContent] = useState<string>("");
  const [editorViewMode, setEditorViewMode] = useState<EditorViewMode>("file");
  const [gitDiffPreview, setGitDiffPreview] = useState<GitDiffPreviewState | null>(null);
  const [splitPane, setSplitPane] = useState<SplitPaneState | null>(null);
  const [splitDropHint, setSplitDropHint] = useState<SplitPaneSide | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [binaryPreviewUrl, setBinaryPreviewUrl] = useState<string | null>(null);
  const [pdfRefreshKey, _setPdfRefreshKey] = useState(0);
  const [pendingGoToLine, setPendingGoToLine] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"files" | "git">("files");
  const [highlightedFile, _setHighlightedFile] = useState<string | null>(null);

  const [createDialog, setCreateDialog] = useState<{
    type: "file" | "directory";
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLatexSettings, setShowLatexSettings] = useState(false);
  const [showLoginCodeModal, setShowLoginCodeModal] = useState(false);
  const [pendingOpenCodeMessage, setPendingOpenCodeMessage] = useState<
    string | null
  >(null);

  const [showMainFileDialog, setShowMainFileDialog] = useState(false);
  const [mainFileDetectionResult, setMainFileDetectionResult] = useState<MainFileDetectionResult | null>(null);
  const [showSynctexInstallDialog, setShowSynctexInstallDialog] = useState(false);
  const pendingSynctexRetryRef = useRef<{
    page: number; x: number; y: number; context: "main" | "split";
  } | null>(null);

  const contentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const splitContentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savingVisualTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<{ path: string; time: number } | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const gitDiffRequestIdRef = useRef(0);
  const splitLoadRequestIdRef = useRef(0);
  const editorWorkspaceRef = useRef<HTMLDivElement | null>(null);

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

  const aiCommit = useAiCommit({
    projectPath: daemon.projectPath,
    opencodePort: opencodeDaemon.opencodePort,
    stagedChanges,
    checkOpencodeStatus: opencodeDaemon.checkOpencodeStatus,
    startOpencode: opencodeDaemon.startOpencode,
    gitDiff: daemon.gitDiff,
    gitCommit: daemon.gitCommit,
    toast,
  });

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
      opencodeDaemon.setShowRightPanel(true);
      setPendingOpenCodeMessage(
        COMPILE_PROMPT.replace("{mainFile}", result.main_file)
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
    opencodeDaemon.setShowRightPanel(true);
    setPendingOpenCodeMessage(
      COMPILE_PROMPT.replace("{mainFile}", mainFile)
    );
  }, [latexSettings, opencodeDaemon]);

  const handleMainFileDialogCancel = useCallback(() => {
    setShowMainFileDialog(false);
    setMainFileDetectionResult(null);
  }, []);

  useEffect(() => {
    if (pendingGoToLine > 0) {
      // Give the editor time to load new file content before clearing
      const timer = setTimeout(() => setPendingGoToLine(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [pendingGoToLine]);

  useEffect(() => {
    if (!daemon.projectPath) {
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

  const handleSynctexClick = useCallback(
    async (page: number, x: number, y: number) => {
      if (!daemon.projectPath || !selectedFile) return;

      // Resolve the PDF path on disk
      const pdfPath = pathSync.join(daemon.projectPath, selectedFile);

      try {
        const result = await invoke<SynctexResult>("latex_synctex_edit", {
          pdfPath,
          page,
          x,
          y,
        });

        // Normalize slashes and resolve "." segments for comparison
        const normalize = (p: string) =>
          p.replace(/\\/g, "/").replace(/\/\.\//g, "/").replace(/\/+/g, "/");

        const normalFile = normalize(result.file);
        const normalProject = normalize(daemon.projectPath);

        let resolvedFile = normalFile;
        if (resolvedFile.startsWith(normalProject)) {
          resolvedFile = resolvedFile.slice(normalProject.length);
          // Remove leading slash
          resolvedFile = resolvedFile.replace(/^\/+/, "");
        }

        // Open the file and navigate to the line
        await handleFileSelect(resolvedFile);
        setPendingGoToLine(result.line);
      } catch (err) {
        const errorStr = String(err);
        if (errorStr.includes("SYNCTEX_NOT_INSTALLED")) {
          pendingSynctexRetryRef.current = { page, x, y, context: "main" };
          setShowSynctexInstallDialog(true);
        } else {
          console.error("SyncTeX lookup failed:", err);
          toast("SyncTeX lookup failed. Check that your PDF has a .synctex.gz file.", "error");
        }
      }
    },
    [daemon.projectPath, selectedFile, handleFileSelect, toast],
  );

  const handleSplitSynctexClick = useCallback(
    async (page: number, x: number, y: number) => {
      if (!daemon.projectPath || !splitPane?.selectedFile) return;

      const pdfPath = pathSync.join(daemon.projectPath, splitPane.selectedFile);

      try {
        const result = await invoke<SynctexResult>("latex_synctex_edit", {
          pdfPath,
          page,
          x,
          y,
        });

        const normalize = (p: string) =>
          p.replace(/\\/g, "/").replace(/\/\.\//g, "/").replace(/\/+/g, "/");

        const normalFile = normalize(result.file);
        const normalProject = normalize(daemon.projectPath);

        let resolvedFile = normalFile;
        if (resolvedFile.startsWith(normalProject)) {
          resolvedFile = resolvedFile.slice(normalProject.length);
          resolvedFile = resolvedFile.replace(/^\/+/, "");
        }

        await handleFileSelect(resolvedFile);
        setPendingGoToLine(result.line);
      } catch (err) {
        const errorStr = String(err);
        if (errorStr.includes("SYNCTEX_NOT_INSTALLED")) {
          pendingSynctexRetryRef.current = { page, x, y, context: "split" };
          setShowSynctexInstallDialog(true);
        } else {
          console.error("SyncTeX lookup failed:", err);
          toast("SyncTeX lookup failed. Check that your PDF has a .synctex.gz file.", "error");
        }
      }
    },
    [daemon.projectPath, splitPane?.selectedFile, handleFileSelect, toast],
  );

  const handleSynctexInstallComplete = useCallback(() => {
    setShowSynctexInstallDialog(false);
    const pending = pendingSynctexRetryRef.current;
    if (pending) {
      pendingSynctexRetryRef.current = null;
      // Small delay to let PATH refresh after installation
      setTimeout(() => {
        if (pending.context === "main") {
          handleSynctexClick(pending.page, pending.x, pending.y);
        } else {
          handleSplitSynctexClick(pending.page, pending.x, pending.y);
        }
      }, 500);
    }
  }, [handleSynctexClick, handleSplitSynctexClick]);

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
                ) : splitFileType === "pdf" ? (
                  <PdfViewer
                    src={splitPane.binaryPreviewUrl}
                    refreshKey={splitPane.pdfRefreshKey}
                    onSynctexClick={handleSplitSynctexClick}
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
      handleSplitSynctexClick,
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

  useKeyboardShortcuts({
    handleOpenFolder: projectMgmt.handleOpenFolder,
    selectedFile,
    handleCloseTab,
    projectPath: daemon.projectPath,
    handleCompileWithDetection,
  });

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
            {getFileType(selectedFile) === "image" ? (
              <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                <img
                  src={binaryPreviewUrl}
                  alt={selectedFile}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : getFileType(selectedFile) === "pdf" ? (
              <PdfViewer
                src={binaryPreviewUrl}
                refreshKey={pdfRefreshKey}
                onSynctexClick={handleSynctexClick}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                <iframe
                  key={pdfRefreshKey}
                  src={binaryPreviewUrl}
                  className="w-full h-full border-0"
                  title={`File: ${selectedFile}`}
                />
              </div>
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
              <MonacoEditor
                content={fileContent}
                readOnly={false}
                onContentChange={handleContentChange}
                language={getFileLanguage(selectedFile)}
                editorSettings={editorSettings.settings}
                editorTheme={editorSettings.editorTheme}
                goToLine={pendingGoToLine}
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
      inactive: false,
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
                onClick={opencodeDaemon.handleToggleRightPanel}
                className={`h-8 w-8 border border-border transition-colors flex items-center justify-center bg-background text-foreground ${
                  opencodeDaemon.showRightPanel
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
                    panelResize.resizing === "sidebar"
                      ? "var(--sidebar-width)"
                      : panelResize.sidebarWidth,
                  willChange: panelResize.resizing === "sidebar" ? "width" : undefined,
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
                      showRemoteInput={gitOps.showRemoteInput}
                      remoteUrl={gitOps.remoteUrl}
                      onRemoteUrlChange={(value) => gitOps.setRemoteUrl(value)}
                      onShowRemoteInput={() => gitOps.setShowRemoteInput(true)}
                      onHideRemoteInput={() => gitOps.setShowRemoteInput(false)}
                      onSubmitRemote={gitOps.handleRemoteSubmit}
                      onInitGit={daemon.gitInit}
                      isInitializingGit={daemon.isInitializingGit}
                      onRefreshStatus={gitOps.handleRefreshGitStatus}
                      onStageAll={gitOps.handleStageAll}
                      onDiscardAll={gitOps.handleDiscardAll}
                      onDiscardFile={gitOps.handleDiscardFile}
                      onStageFile={gitOps.handleStageFile}
                      onUnstageFile={gitOps.handleUnstageFile}
                      onUnstageAll={gitOps.handleUnstageAll}
                      showCommitInput={aiCommit.showCommitInput}
                      commitMessage={aiCommit.commitMessage}
                      onCommitMessageChange={(value) => aiCommit.setCommitMessage(value)}
                      onShowCommitInput={() => aiCommit.setShowCommitInput(true)}
                      onHideCommitInput={() => aiCommit.setShowCommitInput(false)}
                      onCommit={aiCommit.handleCommit}
                      onPush={gitOps.handleGitPush}
                      onPull={gitOps.handleGitPull}
                      onPreviewDiff={handlePreviewGitDiff}
                      onGenerateCommitMessageAI={aiCommit.handleGenerateCommitMessageAI}
                      onOpenFile={(path) => {
                        void handleFileSelect(path);
                      }}
                      onPublishToGitHub={gitOps.handlePublishToGitHub}
                      isGeneratingCommitMessageAI={aiCommit.isGeneratingCommitMessageAI}
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
                  onDragStart={() => panelResize.startResize("sidebar")}
                  onDrag={(event, info) =>
                    panelResize.handleResizeDrag("sidebar", info)
                  }
                  onDragEnd={panelResize.endResize}
                  className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize z-10"
                  style={{ x: 0 }}
                />
                <div
                  className={`w-full h-full transition-colors ${panelResize.resizing === "sidebar" ? "bg-foreground/20" : "group-hover:bg-foreground/20"}`}
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
                    onClick={projectMgmt.handleOpenFolder}
                    className="btn btn-primary"
                  >
                    Open Folder
                  </button>
                  <RecentProjects
                    projects={recentProjects.projects}
                    onSelect={projectMgmt.handleOpenRecentProject}
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
                    panelResize.resizing === "bottom"
                      ? "var(--terminal-height)"
                      : panelResize.terminalHeight,
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
                    onDragStart={() => panelResize.startResize("bottom")}
                    onDrag={(event, info) =>
                      panelResize.handleResizeDrag("bottom", info)
                    }
                    onDragEnd={panelResize.endResize}
                    className="absolute inset-x-0 -top-1 -bottom-1 cursor-row-resize z-10"
                    style={{ y: 0 }}
                  />
                  <div
                    className={`w-full h-full transition-colors ${panelResize.resizing === "bottom" ? "bg-foreground/20" : "group-hover:bg-foreground/20"}`}
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
          {opencodeDaemon.showRightPanel && (
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
                  panelResize.resizing === "right"
                    ? `calc(var(--right-panel-width) + 4px)`
                    : panelResize.rightPanelWidth + 4,
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
                  onDragStart={() => panelResize.startResize("right")}
                  onDrag={(event, info) => panelResize.handleResizeDrag("right", info)}
                  onDragEnd={panelResize.endResize}
                  className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize z-10"
                  style={{ x: 0 }}
                />
                <div
                  className={`w-full h-full transition-colors ${panelResize.resizing === "right" ? "bg-foreground/20" : "group-hover:bg-foreground/20"}`}
                />
              </div>
              <aside
                style={{
                  width:
                    panelResize.resizing === "right"
                      ? "var(--right-panel-width)"
                      : panelResize.rightPanelWidth,
                  willChange: panelResize.resizing === "right" ? "width" : undefined,
                }}
                className="border-l border-border flex flex-col flex-shrink-0 overflow-hidden"
              >
                <OpenCodeErrorBoundary onReset={opencodeDaemon.restartOpencode}>
                  <OpenCodePanel
                    className="h-full"
                    baseUrl={`http://localhost:${opencodeDaemon.opencodePort}`}
                    directory={daemon.projectPath ?? undefined}
                    autoConnect={
                      opencodeDaemon.opencodeDaemonStatus === "running" && !!daemon.projectPath
                    }
                    daemonStatus={opencodeDaemon.opencodeDaemonStatus}
                    onRestartOpenCode={opencodeDaemon.restartOpencode}
                    onMaxReconnectFailed={opencodeDaemon.handleMaxReconnectFailed}
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
        open={opencodeDaemon.showDisconnectedDialog}
        onClose={opencodeDaemon.handleCloseDisconnectedDialog}
        onRestart={opencodeDaemon.handleRestartFromDialog}
      />

      <OpenCodeErrorDialog
        open={!!opencodeDaemon.opencodeError}
        error={opencodeDaemon.opencodeError ?? ""}
        onClose={opencodeDaemon.handleCloseErrorDialog}
        onRetry={opencodeDaemon.restartOpencode}
        onKillPort={opencodeDaemon.handleKillPort}
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

      <SynctexInstallDialog
        open={showSynctexInstallDialog}
        onClose={() => {
          setShowSynctexInstallDialog(false);
          pendingSynctexRetryRef.current = null;
        }}
        onInstallComplete={handleSynctexInstallComplete}
      />

      {gitOps.showGitHubPublishDialog && (
        <GitHubPublishDialog
          defaultRepoName={
            daemon.projectPath
              ? pathSync.basename(daemon.projectPath)
              : "my-project"
          }
          onPublish={gitOps.handleGitHubPublish}
          onCancel={() => {
            gitOps.setShowGitHubPublishDialog(false);
            gitOps.setGhPublishError(null);
          }}
          isCreating={daemon.isCreatingRepo}
          error={gitOps.ghPublishError}
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

