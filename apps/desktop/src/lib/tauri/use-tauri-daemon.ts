"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  FileNode,
  GitInfo,
  GitStatus,
  GitLogEntry,
} from "@lmms-lab/writer-shared";
import { pathSync } from "@/lib/path";

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): { (...args: Parameters<T>): void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
  debouncedFn.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };
  return debouncedFn;
}

interface ProjectInfo {
  path: string;
}

interface GitInitResult {
  success: boolean;
  error?: string;
}

// Split state into logical slices to reduce unnecessary re-renders
interface ProjectState {
  projectPath: string | null;
  projectInfo: ProjectInfo | null;
  files: FileNode[];
}

interface GitState {
  gitInfo: GitInfo | null;
  gitStatus: GitStatus | null;
  isInitializingGit: boolean;
  gitInitResult: GitInitResult | null;
  isPushing: boolean;
  isPulling: boolean;
}

interface OperationState {
  isOpeningProject: boolean;
  isStaging: boolean;
  lastError: { message: string; operation: string } | null;
}

interface FileChangeEvent {
  path: string;
  kind: "create" | "modify" | "remove" | "rename" | "access" | "other" | "unknown";
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2) return trimmed;

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if (
    (first === "\"" && last === "\"") ||
    (first === "'" && last === "'") ||
    (first === "`" && last === "`")
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function isAbsolutePath(path: string): boolean {
  return /^[a-zA-Z]:[\\/]/.test(path) || path.startsWith("\\\\") || path.startsWith("/");
}

function normalizeForCompare(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

function resolvePathWithinProject(projectPath: string, pathInput: string): string {
  let cleanedPath = stripWrappingQuotes(pathInput).replace(/^file:\/\//i, "");

  // file:// URIs on Windows may look like "/C:/path/to/file"
  const drivePathMatch = cleanedPath.match(/^\/([a-zA-Z]:\/.*)$/);
  if (drivePathMatch?.[1]) {
    cleanedPath = drivePathMatch[1];
  }

  if (!cleanedPath) {
    throw new Error("INVALID_PATH:empty path");
  }

  const normalizedProject = normalizeForCompare(projectPath);
  const normalizedPath = normalizeForCompare(cleanedPath);

  if (isAbsolutePath(cleanedPath)) {
    if (
      normalizedPath === normalizedProject ||
      normalizedPath.startsWith(`${normalizedProject}/`)
    ) {
      return cleanedPath;
    }
    throw new Error(`PATH_OUTSIDE_PROJECT:${pathInput}`);
  }

  const relativePath = cleanedPath.replace(/^\.([\\/])+/, "").replace(/^[/\\]+/, "");
  if (!relativePath) {
    throw new Error(`INVALID_PATH:${pathInput}`);
  }

  return pathSync.join(projectPath, relativePath);
}

function convertFileNode(node: {
  name: string;
  path: string;
  type: string;
  children?: unknown[];
}): FileNode {
  return {
    name: node.name,
    path: node.path,
    type: node.type === "directory" ? "directory" : "file",
    children: node.children?.map((child) =>
      convertFileNode(child as typeof node),
    ),
  };
}

export function useTauriDaemon() {
  // Split state into independent slices
  const [projectState, setProjectState] = useState<ProjectState>({
    projectPath: null,
    projectInfo: null,
    files: [],
  });

  const [gitState, setGitState] = useState<GitState>({
    gitInfo: null,
    gitStatus: null,
    isInitializingGit: false,
    gitInitResult: null,
    isPushing: false,
    isPulling: false,
  });

  const [operationState, setOperationState] = useState<OperationState>({
    isOpeningProject: false,
    isStaging: false,
    lastError: null,
  });

  const setError = useCallback((message: string, operation: string) => {
    setOperationState((s) => ({ ...s, lastError: { message, operation } }));
  }, []);

  const clearError = useCallback(() => {
    setOperationState((s) => ({ ...s, lastError: null }));
  }, []);

  const refreshGitStatusInternal = useCallback(async (dir: string) => {
    try {
      const gitStatus = await invoke<GitStatus>("git_status", { dir });

      if (gitStatus.isRepo) {
        const log = await invoke<GitLogEntry[]>("git_log", { dir, limit: 1 });
        const lastCommit = log.length > 0 ? log[0] : undefined;
        const gitInfo: GitInfo = {
          branch: gitStatus.branch,
          isDirty: gitStatus.changes.length > 0,
          lastCommit: lastCommit
            ? {
                hash: lastCommit.hash,
                message: lastCommit.message,
                date: lastCommit.date,
              }
            : undefined,
          ahead: gitStatus.ahead,
          behind: gitStatus.behind,
        };
        setGitState((s) => ({ ...s, gitStatus, gitInfo }));
      } else {
        setGitState((s) => ({ ...s, gitStatus, gitInfo: null }));
      }
    } catch (error) {
      console.error("Failed to get git status:", error);
      setGitState((s) => ({
        ...s,
        gitStatus: {
          branch: "",
          ahead: 0,
          behind: 0,
          changes: [],
          isRepo: false,
        },
        gitInfo: null,
      }));
    }
  }, []);

  const setProject = useCallback(
    async (path: string) => {
      let isMounted = true;

      setProjectState((s) => ({ ...s, projectPath: path }));
      setOperationState((s) => ({
        ...s,
        isOpeningProject: true,
        lastError: null,
      }));

      try {
        await invoke("set_project_path", { path });
        if (!isMounted) return;

        const rawFiles = await invoke<unknown[]>("get_file_tree", {
          dir: path,
        });
        if (!isMounted) return;

        const files = rawFiles.map((f) =>
          convertFileNode(f as Parameters<typeof convertFileNode>[0]),
        );

        setProjectState((s) => ({
          ...s,
          files,
          projectInfo: { path },
        }));

        refreshGitStatusInternal(path);
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to set project:", error);
        setError(String(error), "open project");
      } finally {
        if (isMounted) {
          setOperationState((s) => ({ ...s, isOpeningProject: false }));
        }
      }

      return () => {
        isMounted = false;
      };
    },
    [setError, refreshGitStatusInternal],
  );

  const readFile = useCallback(
    async (relativePath: string): Promise<string | null> => {
      if (!projectState.projectPath || !relativePath) return null;

      const fullPath = resolvePathWithinProject(projectState.projectPath, relativePath);
      try {
        return await invoke<string>("read_file", { path: fullPath });
      } catch (error) {
        const errorStr = String(error);
        // Check if file doesn't exist (os error 2 on Windows, "No such file" on Unix)
        if (errorStr.includes("os error 2") || errorStr.includes("No such file")) {
          console.warn(`File not found: ${relativePath}`);
          throw new Error(`FILE_NOT_FOUND:${relativePath}`);
        }
        console.error("Failed to read file:", error);
        throw error;
      }
    },
    [projectState.projectPath],
  );

  const writeFile = useCallback(
    async (relativePath: string, content: string) => {
      if (!projectState.projectPath) return;

      try {
        const fullPath = resolvePathWithinProject(projectState.projectPath, relativePath);
        await invoke("write_file", {
          path: fullPath,
          content,
          encoding: "utf-8",
        });
      } catch (error) {
        console.error("Failed to write file:", error);
        setError(String(error), "save file");
      }
    },
    [projectState.projectPath, setError],
  );

  const refreshFiles = useCallback(async () => {
    if (!projectState.projectPath) return;

    try {
      const rawFiles = await invoke<unknown[]>("get_file_tree", {
        dir: projectState.projectPath,
      });
      const files = rawFiles.map((f) =>
        convertFileNode(f as Parameters<typeof convertFileNode>[0]),
      );
      setProjectState((s) => ({ ...s, files }));
    } catch (error) {
      console.error("Failed to refresh files:", error);
    }
  }, [projectState.projectPath]);

  const createFile = useCallback(
    async (relativePath: string) => {
      if (!projectState.projectPath) return;

      try {
        const fullPath = resolvePathWithinProject(projectState.projectPath, relativePath);
        await invoke("create_file", {
          path: fullPath,
          encoding: "utf-8",
        });
        await refreshFiles();
      } catch (error) {
        console.error("Failed to create file:", error);
        setError(String(error), "create file");
        throw error;
      }
    },
    [projectState.projectPath, refreshFiles, setError],
  );

  const createDirectory = useCallback(
    async (relativePath: string) => {
      if (!projectState.projectPath) return;

      try {
        const fullPath = resolvePathWithinProject(projectState.projectPath, relativePath);
        await invoke("create_directory", { path: fullPath });
        await refreshFiles();
      } catch (error) {
        console.error("Failed to create directory:", error);
        setError(String(error), "create directory");
        throw error;
      }
    },
    [projectState.projectPath, refreshFiles, setError],
  );

  const renamePath = useCallback(
    async (oldRelativePath: string, newRelativePath: string) => {
      if (!projectState.projectPath) return;

      try {
        const oldFullPath = resolvePathWithinProject(
          projectState.projectPath,
          oldRelativePath,
        );
        const newFullPath = resolvePathWithinProject(
          projectState.projectPath,
          newRelativePath,
        );
        await invoke("rename_path", {
          oldPath: oldFullPath,
          newPath: newFullPath,
        });
        await refreshFiles();
      } catch (error) {
        console.error("Failed to rename:", error);
        setError(String(error), "rename");
        throw error;
      }
    },
    [projectState.projectPath, refreshFiles, setError],
  );

  const deletePath = useCallback(
    async (relativePath: string) => {
      if (!projectState.projectPath) return;

      try {
        const fullPath = resolvePathWithinProject(projectState.projectPath, relativePath);
        await invoke("delete_path", { path: fullPath });
        await refreshFiles();
      } catch (error) {
        console.error("Failed to delete:", error);
        setError(String(error), "delete");
        throw error;
      }
    },
    [projectState.projectPath, refreshFiles, setError],
  );

  const refreshGitStatus = useCallback(async () => {
    if (!projectState.projectPath) return;
    await refreshGitStatusInternal(projectState.projectPath);
  }, [projectState.projectPath, refreshGitStatusInternal]);

  const gitAdd = useCallback(
    async (files: string[]) => {
      if (!projectState.projectPath) return;

      setOperationState((s) => ({ ...s, isStaging: true }));
      try {
        await invoke("git_add", { dir: projectState.projectPath, files });
        await refreshGitStatus();
      } catch (error) {
        console.error("Failed to git add:", error);
        setError(String(error), "stage files");
      } finally {
        setOperationState((s) => ({ ...s, isStaging: false }));
      }
    },
    [projectState.projectPath, refreshGitStatus, setError],
  );

  const gitCommit = useCallback(
    async (message: string): Promise<{ success: boolean; error?: string }> => {
      if (!projectState.projectPath)
        return { success: false, error: "No project" };

      try {
        await invoke("git_commit", { dir: projectState.projectPath, message });
        await refreshGitStatus();
        return { success: true };
      } catch (error) {
        console.error("Failed to git commit:", error);
        return { success: false, error: String(error) };
      }
    },
    [projectState.projectPath, refreshGitStatus],
  );

  const gitPush = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!projectState.projectPath)
      return { success: false, error: "No project" };

    setGitState((s) => ({ ...s, isPushing: true }));
    try {
      await invoke("git_push", { dir: projectState.projectPath });
      await refreshGitStatus();
      return { success: true };
    } catch (error) {
      console.error("Failed to git push:", error);
      return { success: false, error: String(error) };
    } finally {
      setGitState((s) => ({ ...s, isPushing: false }));
    }
  }, [projectState.projectPath, refreshGitStatus]);

  const gitPull = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!projectState.projectPath)
      return { success: false, error: "No project" };

    setGitState((s) => ({ ...s, isPulling: true }));
    try {
      await invoke("git_pull", { dir: projectState.projectPath });
      // Parallel refresh after pull
      await Promise.all([refreshGitStatus(), refreshFiles()]);
      return { success: true };
    } catch (error) {
      console.error("Failed to git pull:", error);
      return { success: false, error: String(error) };
    } finally {
      setGitState((s) => ({ ...s, isPulling: false }));
    }
  }, [projectState.projectPath, refreshGitStatus, refreshFiles]);

  const gitInit = useCallback(async () => {
    if (!projectState.projectPath) return;

    setGitState((s) => ({
      ...s,
      isInitializingGit: true,
      gitInitResult: null,
    }));

    try {
      await invoke("git_init", { dir: projectState.projectPath });
      setGitState((s) => ({
        ...s,
        isInitializingGit: false,
        gitInitResult: { success: true },
      }));
      await refreshGitStatus();
    } catch (error) {
      setGitState((s) => ({
        ...s,
        isInitializingGit: false,
        gitInitResult: { success: false, error: String(error) },
      }));
    }
  }, [projectState.projectPath, refreshGitStatus]);

  const gitAddRemote = useCallback(
    async (url: string, name = "origin") => {
      if (!projectState.projectPath) return;

      try {
        await invoke("git_add_remote", {
          dir: projectState.projectPath,
          name,
          url,
        });
        await refreshGitStatus();
      } catch (error) {
        console.error("Failed to add remote:", error);
        setError(String(error), "add remote");
      }
    },
    [projectState.projectPath, refreshGitStatus, setError],
  );

  const gitDiff = useCallback(
    async (file: string, staged = false): Promise<string> => {
      if (!projectState.projectPath) return "";

      try {
        return await invoke<string>("git_diff", {
          dir: projectState.projectPath,
          file,
          staged,
        });
      } catch (error) {
        console.error("Failed to get git diff:", error);
        throw error;
      }
    },
    [projectState.projectPath],
  );

  const clearGitInitResult = useCallback(() => {
    setGitState((s) => ({ ...s, gitInitResult: null }));
  }, []);

  const [lastFileChange, setLastFileChange] = useState<FileChangeEvent | null>(
    null,
  );

  const projectPathRef = useRef(projectState.projectPath);
  projectPathRef.current = projectState.projectPath;

  useEffect(() => {
    if (!projectState.projectPath) return;

    let isCleanedUp = false;
    let watcherStarted = false;
    let unlistenFiles: (() => void) | null = null;
    let unlistenFileChanged: (() => void) | null = null;

    const debouncedRefreshFileTree = debounce(async (dir: string) => {
      if (isCleanedUp) return;
      try {
        const rawFiles = await invoke<unknown[]>("get_file_tree", { dir });
        if (isCleanedUp) return;
        const files = rawFiles.map((f) =>
          convertFileNode(f as Parameters<typeof convertFileNode>[0]),
        );
        setProjectState((s) => ({ ...s, files }));
      } catch (error) {
        if (!isCleanedUp) {
          console.error("Failed to refresh file tree:", error);
        }
      }
    }, 300);

    const debouncedRefreshGit = debounce(async (dir: string) => {
      if (isCleanedUp) return;
      refreshGitStatusInternal(dir);
    }, 200);

    const setupListeners = async () => {
      if (isCleanedUp) return;

      let listen: typeof import("@tauri-apps/api/event").listen;
      try {
        const eventModule = await import("@tauri-apps/api/event");
        listen = eventModule.listen;
      } catch (error) {
        console.error("Failed to import Tauri event API:", error);
        return;
      }

      if (isCleanedUp) return;

      unlistenFiles = await listen<FileNode[]>("files-changed", (event) => {
        if (!isCleanedUp) {
          setProjectState((s) => ({ ...s, files: event.payload }));
        }
      });

      if (isCleanedUp) {
        unlistenFiles?.();
        return;
      }

      unlistenFileChanged = await listen<FileChangeEvent>(
        "file-changed",
        (event) => {
          if (isCleanedUp) return;

          const { path, kind } = event.payload;

          setLastFileChange(event.payload);

          const currentPath = projectPathRef.current;
          if (!currentPath) return;

          if (kind === "create" || kind === "remove" || kind === "rename") {
            debouncedRefreshFileTree(currentPath);
          }

          if (kind === "create" || kind === "modify" || kind === "remove") {
            debouncedRefreshGit(currentPath);
          }
        },
      );

      if (isCleanedUp) {
        unlistenFiles?.();
        unlistenFileChanged?.();
      }
    };

    const startWatcher = async () => {
      if (isCleanedUp) return;
      try {
        await invoke("watch_directory", { path: projectState.projectPath });
        watcherStarted = true;
      } catch (error) {
        console.error("Failed to start watcher:", error);
      }
    };

    // Ensure listeners are ready before starting watcher to avoid missing events
    (async () => {
      await setupListeners();
      if (!isCleanedUp) {
        await startWatcher();
      }
    })();

    return () => {
      isCleanedUp = true;
      debouncedRefreshFileTree.cancel();
      debouncedRefreshGit.cancel();
      unlistenFiles?.();
      unlistenFileChanged?.();
      if (watcherStarted) {
        invoke("stop_watch").catch((error) =>
          console.error("Failed to stop watch:", error),
        );
      }
    };
  }, [projectState.projectPath, refreshGitStatusInternal]);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Connection status (always true for Tauri)
      connected: true,
      version: "1.0.0" as const,

      // Project state
      projectPath: projectState.projectPath,
      projectInfo: projectState.projectInfo,
      files: projectState.files,

      // Git state
      gitInfo: gitState.gitInfo,
      gitStatus: gitState.gitStatus,
      isInitializingGit: gitState.isInitializingGit,
      gitInitResult: gitState.gitInitResult,
      isPushing: gitState.isPushing,
      isPulling: gitState.isPulling,

      lastFileChange,

      // Operation state
      isOpeningProject: operationState.isOpeningProject,
      isStaging: operationState.isStaging,
      lastError: operationState.lastError,

      // Actions
      setProject,
      refreshFiles,
      readFile,
      writeFile,
      createFile,
      createDirectory,
      renamePath,
      deletePath,
      gitAdd,
      gitCommit,
      gitPush,
      gitPull,
      gitInit,
      gitAddRemote,
      gitDiff,
      clearGitInitResult,
      refreshGitStatus,
      clearError,
    }),
    [
      projectState,
      gitState,
      operationState,
      lastFileChange,
      setProject,
      refreshFiles,
      readFile,
      writeFile,
      createFile,
      createDirectory,
      renamePath,
      deletePath,
      gitAdd,
      gitCommit,
      gitPush,
      gitPull,
      gitInit,
      gitAddRemote,
      gitDiff,
      clearGitInitResult,
      refreshGitStatus,
      clearError,
    ],
  );
}
