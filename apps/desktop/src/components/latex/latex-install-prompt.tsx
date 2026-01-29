"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLatexInstaller } from "@/lib/latex";
import { Spinner } from "@/components/ui/spinner";

interface LaTeXInstallPromptProps {
  onInstallComplete?: () => void;
}

export function LaTeXInstallPrompt({ onInstallComplete }: LaTeXInstallPromptProps) {
  const {
    distributions,
    status,
    progress,
    result,
    fetchDistributions,
    install,
    openDownloadPage,
    reset,
    isInstalling,
  } = useLatexInstaller();

  useEffect(() => {
    fetchDistributions();
  }, [fetchDistributions]);

  useEffect(() => {
    if (result?.success && result.needs_restart) {
      onInstallComplete?.();
    }
  }, [result, onInstallComplete]);

  const handleInstall = async (distributionId: string) => {
    await install(distributionId);
  };

  const handleOpenDownload = (url: string) => {
    openDownloadPage(url);
  };

  return (
    <div className="bg-amber-50 border-2 border-amber-400 p-4">
      <div className="flex items-start gap-3">
        {/* Warning Icon */}
        <svg
          className="size-6 text-amber-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-amber-800">LaTeX Not Detected</h3>
          <p className="text-sm text-amber-700 mt-1">
            No LaTeX compiler was found on your system. Install a LaTeX distribution to compile documents.
          </p>

          {/* Installation Progress */}
          <AnimatePresence mode="wait">
            {isInstalling && progress && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-white border border-amber-300 rounded"
              >
                <div className="flex items-center gap-2">
                  <Spinner className="size-4" />
                  <span className="text-sm font-medium">{progress.stage}</span>
                </div>
                <p className="text-sm text-muted mt-1 break-words">{progress.message}</p>
                {progress.progress !== null && (
                  <div className="mt-2 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${progress.progress * 100}%` }}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-3 p-3 border rounded ${
                  result.success
                    ? "bg-green-50 border-green-300"
                    : "bg-white border-amber-300"
                }`}
              >
                <p className={`text-sm whitespace-pre-wrap ${
                  result.success ? "text-green-700" : "text-neutral-700"
                }`}>
                  {result.message}
                </p>
                {result.needs_restart && result.success && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    Please restart the application to detect the new installation.
                  </p>
                )}
                {!result.success && (
                  <button
                    onClick={reset}
                    className="mt-2 text-sm text-amber-700 hover:text-amber-900 underline"
                  >
                    Try again
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Distribution Options */}
          {!isInstalling && !result && distributions.length > 0 && (
            <div className="mt-4 space-y-2">
              {distributions.map((dist) => (
                <div
                  key={dist.id}
                  className="flex items-center justify-between gap-3 p-3 bg-white border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{dist.name}</div>
                    <p className="text-xs text-muted mt-0.5">{dist.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {dist.install_command && (
                      <button
                        onClick={() => handleInstall(dist.id)}
                        className="btn btn-sm border-2 border-black bg-black text-white shadow-[2px_2px_0_0_#fbbf24] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                      >
                        Install
                      </button>
                    )}
                    {dist.download_url && (
                      <button
                        onClick={() => handleOpenDownload(dist.download_url!)}
                        className="btn btn-sm border-2 border-amber-600 bg-white text-amber-700 hover:bg-amber-50 transition-colors"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading state */}
          {!isInstalling && !result && distributions.length === 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
              <Spinner className="size-4" />
              Loading available distributions...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
