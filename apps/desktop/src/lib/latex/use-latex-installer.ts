import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { InstallProgress, InstallResult, LaTeXDistribution } from "./types";

export type InstallStatus = "idle" | "loading" | "installing" | "success" | "error";

export function useLatexInstaller() {
  const [distributions, setDistributions] = useState<LaTeXDistribution[]>([]);
  const [status, setStatus] = useState<InstallStatus>("idle");
  const [progress, setProgress] = useState<InstallProgress | null>(null);
  const [result, setResult] = useState<InstallResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Fetch available distributions
  const fetchDistributions = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await invoke<LaTeXDistribution[]>("latex_get_distributions");
      setDistributions(result);
      setStatus("idle");
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setStatus("error");
      return [];
    }
  }, []);

  // Set up event listener for install progress
  useEffect(() => {
    let mounted = true;

    const setupListener = async () => {
      if (unlistenRef.current) {
        unlistenRef.current();
      }

      unlistenRef.current = await listen<InstallProgress>(
        "latex-install-progress",
        (event) => {
          if (!mounted) return;
          setProgress(event.payload);
        }
      );
    };

    setupListener();

    return () => {
      mounted = false;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);

  // Install a distribution
  const install = useCallback(async (distributionId: string) => {
    setStatus("installing");
    setProgress(null);
    setResult(null);
    setError(null);

    try {
      const installResult = await invoke<InstallResult>("latex_install", {
        distributionId,
      });
      setResult(installResult);
      setStatus(installResult.success ? "success" : "error");
      if (!installResult.success) {
        setError(installResult.message);
      }
      return installResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setStatus("error");
      return null;
    }
  }, []);

  // Open download page
  const openDownloadPage = useCallback(async (url: string) => {
    try {
      await invoke("latex_open_download_page", { url });
    } catch (err) {
      console.error("Failed to open download page:", err);
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    // Data
    distributions,
    status,
    progress,
    result,
    error,

    // Actions
    fetchDistributions,
    install,
    openDownloadPage,
    reset,

    // Computed
    isLoading: status === "loading",
    isInstalling: status === "installing",
    hasError: status === "error",
    hasSuccess: status === "success",
  };
}
