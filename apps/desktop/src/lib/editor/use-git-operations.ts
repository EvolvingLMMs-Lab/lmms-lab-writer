"use client";

import { useCallback, useState } from "react";
import type { useTauriDaemon } from "@/lib/tauri";

interface UseGitOperationsOptions {
  daemon: ReturnType<typeof useTauriDaemon>;
  toast: (message: string, type: "success" | "error" | "info") => void;
}

export function useGitOperations({ daemon, toast }: UseGitOperationsOptions) {
  const [showRemoteInput, setShowRemoteInput] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [showGitHubPublishDialog, setShowGitHubPublishDialog] = useState(false);
  const [ghPublishError, setGhPublishError] = useState<string | null>(null);

  const gitStatus = daemon.gitStatus;

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
      .filter((c: { staged: boolean }) => c.staged)
      .map((c: { path: string }) => c.path);
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

  const handleDiscardFile = useCallback(
    async (path: string) => {
      const result = await daemon.gitDiscardFile(path);
      if (result.success) {
        toast(`Discarded changes: ${path}`, "success");
      } else {
        toast(result.error || "Failed to discard file", "error");
      }
    },
    [daemon, toast],
  );

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
      const result = await daemon.ghCreateRepo(
        name,
        isPrivate,
        description || undefined,
      );
      if (result.success) {
        setShowGitHubPublishDialog(false);
        toast(`Repository published: ${result.url}`, "success");
      } else {
        setGhPublishError(result.error || "Failed to create repository");
      }
    },
    [daemon, toast],
  );

  return {
    showRemoteInput,
    setShowRemoteInput,
    remoteUrl,
    setRemoteUrl,
    showGitHubPublishDialog,
    setShowGitHubPublishDialog,
    ghPublishError,
    setGhPublishError,
    handleStageAll,
    handleStageFile,
    handleUnstageAll,
    handleUnstageFile,
    handleRemoteSubmit,
    handleGitPush,
    handleGitPull,
    handleRefreshGitStatus,
    handleDiscardAll,
    handleDiscardFile,
    handlePublishToGitHub,
    handleGitHubPublish,
  };
}
