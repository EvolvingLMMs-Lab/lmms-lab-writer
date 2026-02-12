"use client";

import { useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { WarningIcon, XIcon, ArrowClockwiseIcon } from "@phosphor-icons/react";
import { useLatexInstaller } from "@/lib/latex";
import { Spinner } from "@/components/ui/spinner";

interface SynctexInstallDialogProps {
  open: boolean;
  onClose: () => void;
  onInstallComplete: () => void;
}

export function SynctexInstallDialog({
  open,
  onClose,
  onInstallComplete,
}: SynctexInstallDialogProps) {
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
    if (open) {
      fetchDistributions();
    }
  }, [open, fetchDistributions]);

  const handleInstall = async (distributionId: string) => {
    await install(distributionId);
  };

  const handleOpenDownload = (url: string) => {
    openDownloadPage(url);
  };

  const handleRetry = useCallback(() => {
    reset();
    onInstallComplete();
  }, [reset, onInstallComplete]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-foreground/50 z-[9999]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] bg-background border-2 border-foreground shadow-[4px_4px_0_0_var(--foreground)] w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
          onPointerDownOutside={(e) => {
            if (isInstalling) e.preventDefault();
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <WarningIcon className="size-5 text-amber-600" />
              <Dialog.Title className="text-base font-bold tracking-tight">
                SyncTeX Not Available
              </Dialog.Title>
            </div>
            {!isInstalling && (
              <Dialog.Close
                className="p-1.5 hover:bg-accent-hover transition-colors border border-transparent hover:border-border"
                aria-label="Close"
              >
                <XIcon className="size-4" />
              </Dialog.Close>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="text-sm text-foreground-secondary leading-relaxed">
              SyncTeX is required for PDF-to-source navigation but was not found
              on your system. It comes bundled with all TeX distributions.
              Install one below to enable this feature.
            </p>

            {/* Installation Progress */}
            <AnimatePresence mode="wait">
              {isInstalling && progress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 bg-surface-secondary border border-amber-300"
                >
                  <div className="flex items-center gap-2">
                    <Spinner className="size-4" />
                    <span className="text-sm font-medium">{progress.stage}</span>
                  </div>
                  <p className="text-sm text-muted mt-1 break-words">
                    {progress.message}
                  </p>
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
                  className={`mt-4 p-3 border ${
                    result.success
                      ? "bg-green-50 border-green-300"
                      : "bg-background border-amber-300"
                  }`}
                >
                  <p
                    className={`text-sm whitespace-pre-wrap ${
                      result.success
                        ? "text-green-700"
                        : "text-foreground-secondary"
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.success && (
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={handleRetry}
                        className="btn btn-sm border-2 border-green-600 bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        Retry SyncTeX
                      </button>
                      <span className="text-xs text-green-600">
                        Click to navigate to source
                      </span>
                    </div>
                  )}
                  {!result.success && (
                    <button
                      onClick={reset}
                      className="mt-2 text-sm text-amber-700 hover:text-amber-900 underline flex items-center gap-1"
                    >
                      <ArrowClockwiseIcon className="size-3.5" />
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
                    className={`flex items-center justify-between gap-3 p-3 bg-background border transition-colors ${
                      index === 0
                        ? "border-green-400 hover:border-green-500"
                        : "border-border hover:border-foreground/30"
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
                      <p className="text-xs text-muted mt-0.5">
                        {dist.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {dist.install_command && (
                        <button
                          onClick={() => handleInstall(dist.id)}
                          className={`btn btn-sm border-2 transition-all ${
                            index === 0
                              ? "border-green-600 bg-green-600 text-white shadow-[2px_2px_0_0_#22c55e] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                              : "border-foreground bg-foreground text-background shadow-[2px_2px_0_0_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
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
                              : "border-border bg-background text-muted hover:bg-accent-hover"
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
              <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                <Spinner className="size-4" />
                Loading available distributions...
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-5 py-4 border-t border-border">
            {!isInstalling && (
              <button
                onClick={handleClose}
                className="px-6 py-2 text-sm font-medium bg-background text-foreground border-2 border-foreground shadow-[3px_3px_0_0_var(--foreground)] hover:shadow-[1px_1px_0_0_var(--foreground)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Dismiss
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
