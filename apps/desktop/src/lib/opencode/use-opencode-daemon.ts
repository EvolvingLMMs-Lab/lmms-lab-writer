"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { OpenCodeStatus, OpenCodeDaemonStatus } from "./ai-commit";

interface UseOpencodeDaemonOptions {
  projectPath: string | null;
  toast: (message: string, type: "success" | "error" | "info") => void;
}

export function useOpencodeDaemon({ projectPath, toast }: UseOpencodeDaemonOptions) {
  const [opencodeDaemonStatus, setOpencodeDaemonStatus] =
    useState<OpenCodeDaemonStatus>("stopped");
  const [opencodePort, setOpencodePort] = useState(4096);
  const [showDisconnectedDialog, setShowDisconnectedDialog] = useState(false);
  const [opencodeError, setOpencodeError] = useState<string | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const opencodeStartedForPathRef = useRef<string | null>(null);

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
    if (!projectPath) {
      toast("Please open a project first.", "error");
      return;
    }

    if (opencodeDaemonStatus === "unavailable") {
      const status = await checkOpencodeStatus();
      if (!status?.installed) {
        toast(
          "OpenCode is still not installed. Please install it first:\nnpm i -g opencode-ai@latest\nor\nbrew install sst/tap/opencode",
          "error",
        );
        return;
      }
      if (!status.running) {
        await startOpencode(projectPath);
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
        directory: projectPath,
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
    projectPath,
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

    if (willOpen && projectPath && opencodeDaemonStatus === "stopped") {
      const status = await checkOpencodeStatus();
      if (status?.installed && !status.running) {
        await startOpencode(projectPath);
      } else if (status?.running) {
        opencodeStartedForPathRef.current = projectPath;
      }
    }
  }, [
    showRightPanel,
    projectPath,
    opencodeDaemonStatus,
    checkOpencodeStatus,
    startOpencode,
  ]);

  // Check initial status
  useEffect(() => {
    checkOpencodeStatus();
  }, [checkOpencodeStatus]);

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

  // Reset when project changes
  useEffect(() => {
    if (!projectPath) {
      opencodeStartedForPathRef.current = null;
    }
  }, [projectPath]);

  return {
    opencodeDaemonStatus,
    opencodePort,
    showDisconnectedDialog,
    opencodeError,
    showRightPanel,
    setShowRightPanel,
    checkOpencodeStatus,
    startOpencode,
    restartOpencode,
    handleMaxReconnectFailed,
    handleCloseDisconnectedDialog,
    handleRestartFromDialog,
    handleCloseErrorDialog,
    handleKillPort,
    handleToggleRightPanel,
  };
}
