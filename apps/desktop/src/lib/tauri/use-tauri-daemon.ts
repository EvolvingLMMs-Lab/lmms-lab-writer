"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import type {
  FileNode,
  GitInfo,
  GitStatus,
  GitLogEntry,
} from "@lmms-lab/writer-shared";

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
}

interface FileChangeEvent {
  path: string;
  kind: "create" | "modify" | "remove" | "access" | "other" | "unknown";
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
  });

  const setProject = useCallback(async (path: string) => {
    setProjectState((s) => ({ ...s, projectPath: path }));

    try {
      const [rawFiles] = await Promise.all([
        invoke<unknown[]>("get_file_tree", { dir: path }),
        invoke("watch_directory", { path }),
      ]);

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
      console.error("Failed to set project:", error);
    }
  }, []);

  const readFile = useCallback(
    async (relativePath: string): Promise<string | null> => {
      if (!projectState.projectPath || !relativePath) return null;

      const fullPath = `${projectState.projectPath}/${relativePath}`;
      try {
        return await invoke<string>("read_file", { path: fullPath });
      } catch {
        return null;
      }
    },
    [projectState.projectPath],
  );

  const writeFile = useCallback(
    async (relativePath: string, content: string) => {
      if (!projectState.projectPath) return;

      try {
        const fullPath = `${projectState.projectPath}/${relativePath}`;
        await invoke("write_file", { path: fullPath, content });
      } catch (error) {
        console.error("Failed to write file:", error);
      }
    },
    [projectState.projectPath],
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

  // Internal function to avoid dependency cycle
  const refreshGitStatusInternal = useCallback(async (dir: string) => {
    try {
      const gitStatus = await invoke<GitStatus>("git_status", { dir });

      if (gitStatus.isRepo) {
        // Get git log in parallel with status update
        const log = await invoke<GitLogEntry[]>("git_log", { dir, limit: 1 });
        const lastCommit = log[0];
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

  const refreshGitStatus = useCallback(async () => {
    if (!projectState.projectPath) return;
    await refreshGitStatusInternal(projectState.projectPath);
  }, [projectState.projectPath, refreshGitStatusInternal]);

  const gitAdd = useCallback(
    async (files: string[]) => {
      if (!projectState.projectPath) return;

      try {
        await invoke("git_add", { dir: projectState.projectPath, files });
        await refreshGitStatus();
      } catch (error) {
        console.error("Failed to git add:", error);
      }
    },
    [projectState.projectPath, refreshGitStatus],
  );

  const gitCommit = useCallback(
    async (message: string) => {
      if (!projectState.projectPath) return;

      try {
        await invoke("git_commit", { dir: projectState.projectPath, message });
        await refreshGitStatus();
      } catch (error) {
        console.error("Failed to git commit:", error);
      }
    },
    [projectState.projectPath, refreshGitStatus],
  );

  const gitPush = useCallback(async () => {
    if (!projectState.projectPath) return;

    try {
      await invoke("git_push", { dir: projectState.projectPath });
      await refreshGitStatus();
    } catch (error) {
      console.error("Failed to git push:", error);
    }
  }, [projectState.projectPath, refreshGitStatus]);

  const gitPull = useCallback(async () => {
    if (!projectState.projectPath) return;

    try {
      await invoke("git_pull", { dir: projectState.projectPath });
      // Parallel refresh after pull
      await Promise.all([refreshGitStatus(), refreshFiles()]);
    } catch (error) {
      console.error("Failed to git pull:", error);
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
      }
    },
    [projectState.projectPath, refreshGitStatus],
  );

  const clearGitInitResult = useCallback(() => {
    setGitState((s) => ({ ...s, gitInitResult: null }));
  }, []);

  const [lastFileChange, setLastFileChange] = useState<FileChangeEvent | null>(
    null,
  );

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListeners = async () => {
      const { listen } = await import("@tauri-apps/api/event");

      const unlistenFiles = await listen<FileNode[]>(
        "files-changed",
        (event) => {
          setProjectState((s) => ({ ...s, files: event.payload }));
        },
      );

      const unlistenFileChanged = await listen<FileChangeEvent>(
        "file-changed",
        async (event) => {
          const { path: changedPath, kind } = event.payload;
          setLastFileChange(event.payload);

          if (kind === "create" || kind === "remove") {
            const currentPath = projectState.projectPath;
            if (currentPath) {
              try {
                const rawFiles = await invoke<unknown[]>("get_file_tree", {
                  dir: currentPath,
                });
                const files = rawFiles.map((f) =>
                  convertFileNode(f as Parameters<typeof convertFileNode>[0]),
                );
                setProjectState((s) => ({ ...s, files }));
              } catch {}
            }
          }

          if (kind === "create" || kind === "modify" || kind === "remove") {
            const currentPath = projectState.projectPath;
            if (currentPath) {
              refreshGitStatusInternal(currentPath);
            }
          }
        },
      );

      unlisten = () => {
        unlistenFiles();
        unlistenFileChanged();
      };
    };

    setupListeners();

    return () => {
      unlisten?.();
      invoke("stop_watch").catch(() => {});
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

      lastFileChange,

      // Actions
      setProject,
      refreshFiles,
      readFile,
      writeFile,
      gitAdd,
      gitCommit,
      gitPush,
      gitPull,
      gitInit,
      gitAddRemote,
      clearGitInitResult,
      refreshGitStatus,
    }),
    [
      projectState,
      gitState,
      lastFileChange,
      setProject,
      refreshFiles,
      readFile,
      writeFile,
      gitAdd,
      gitCommit,
      gitPush,
      gitPull,
      gitInit,
      gitAddRemote,
      clearGitInitResult,
      refreshGitStatus,
    ],
  );
}
