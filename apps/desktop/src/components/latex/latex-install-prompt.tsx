"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLatexInstaller } from "@/lib/latex";
import { Spinner } from "@/components/ui/spinner";
import { ArrowClockwiseIcon, WarningIcon } from "@phosphor-icons/react";

interface LaTeXInstallPromptProps {
  onRefreshCompilers?: () => void;
}

export function LaTeXInstallPrompt({ onRefreshCompilers }: LaTeXInstallPromptProps) {
  const {
    distributions,
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

  const handleInstall = async (distributionId: string) => {
    await install(distributionId);
  };

  const handleOpenDownload = (url: string) => {
    openDownloadPage(url);
  };

  const handleRefresh = useCallback(() => {
    onRefreshCompilers?.();
    reset();
  }, [onRefreshCompilers, reset]);

  return (
    <div className="bg-amber-50 border-2 border-amber-400 p-4">
      <div className="flex items-start gap-3">
        {/* Warning Icon */}
        <WarningIcon className="size-6 text-amber-600 flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-amber-800">LaTeX Not Detected</h3>
              <p className="text-sm text-amber-700 mt-1">
                No LaTeX compiler was found on your system. Install a LaTeX distribution to compile documents.
              </p>
            </div>
            {!isInstalling && !result && (
              <button
                onClick={handleRefresh}
                className="flex-shrink-0 p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                title="Refresh compiler detection"
              >
                <ArrowClockwiseIcon className="size-4" />
              </button>
            )}
          </div>

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
                {result.success && (
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={handleRefresh}
                      className="btn btn-sm border-2 border-green-600 bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Refresh Compilers
                    </button>
                    <span className="text-xs text-green-600">
                      Click to detect the newly installed compiler
                    </span>
                  </div>
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
              {distributions.map((dist, index) => (
                <div
                  key={dist.id}
                  className={`flex items-center justify-between gap-3 p-3 bg-white border transition-colors ${
                    index === 0
                      ? "border-green-400 hover:border-green-500"
                      : "border-amber-200 hover:border-amber-400"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {dist.name}
                      {index === 0 && (
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 font-normal">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{dist.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {dist.install_command && (
                      <button
                        onClick={() => handleInstall(dist.id)}
                        className={`btn btn-sm border-2 transition-all ${
                          index === 0
                            ? "border-green-600 bg-green-600 text-white shadow-[2px_2px_0_0_#22c55e] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            : "border-black bg-black text-white shadow-[2px_2px_0_0_#fbbf24] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        }`}
                      >
                        Install
                      </button>
                    )}
                    {dist.download_url && (
                      <button
                        onClick={() => handleOpenDownload(dist.download_url!)}
                        className={`btn btn-sm border-2 transition-colors ${
                          index === 0 && !dist.install_command
                            ? "border-green-600 bg-green-600 text-white hover:bg-green-700"
                            : "border-amber-600 bg-white text-amber-700 hover:bg-amber-50"
                        }`}
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
