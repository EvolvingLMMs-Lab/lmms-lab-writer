"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { WarningIcon, XIcon } from "@phosphor-icons/react";

type ErrorType = "port_in_use" | "not_installed" | "generic";

type Props = {
  open: boolean;
  error: string;
  onClose: () => void;
  onRetry: () => void;
  onKillPort?: (port: number) => Promise<void>;
};

function parseErrorType(error: string): { type: ErrorType; port?: number } {
  const portMatch = error.match(/Port (\d+) is already in use/);
  if (portMatch?.[1]) {
    return { type: "port_in_use", port: parseInt(portMatch[1], 10) };
  }
  if (error.includes("not installed") || error.includes("not found")) {
    return { type: "not_installed" };
  }
  return { type: "generic" };
}

export function OpenCodeErrorDialog({
  open,
  error,
  onClose,
  onRetry,
  onKillPort,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [killing, setKilling] = useState(false);

  const { type: errorType, port } = parseErrorType(error);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently ignore clipboard errors
    }
  }, [error]);

  const handleKillPort = useCallback(async () => {
    if (!port || !onKillPort) return;
    setKilling(true);
    try {
      await onKillPort(port);
      onRetry();
    } catch {
      setKilling(false);
    }
  }, [port, onKillPort, onRetry]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-dialog-title"
    >
      <div
        className="absolute inset-0 bg-foreground/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="relative bg-background border border-foreground w-full max-w-md mx-4 shadow-[3px_3px_0_var(--foreground)]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 id="error-dialog-title" className="text-sm font-medium">
            OpenCode Error
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <WarningIcon className="size-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              {errorType === "port_in_use" && (
                <p className="text-sm text-foreground mb-2">
                  Port {port} is already in use by another process.
                </p>
              )}
              {errorType === "not_installed" && (
                <p className="text-sm text-foreground mb-2">
                  OpenCode is not installed on your system.
                </p>
              )}
              {errorType === "generic" && (
                <p className="text-sm text-foreground mb-2">
                  Failed to start OpenCode.
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 relative">
            <div className="bg-surface-secondary border border-border p-3 text-xs font-mono break-all max-h-32 overflow-y-auto">
              {error}
            </div>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-2 py-1 text-xs bg-background border border-border hover:border-foreground transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {errorType === "port_in_use" && onKillPort && (
            <div className="mt-4 p-3 border border-border bg-accent-hover">
              <p className="text-xs text-muted mb-2">
                Would you like to automatically kill the process using port{" "}
                {port} and restart OpenCode?
              </p>
              <button
                onClick={handleKillPort}
                disabled={killing}
                className="w-full px-3 py-2 text-xs bg-background text-foreground border border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
              >
                {killing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner className="size-3" />
                    Killing process...
                  </span>
                ) : (
                  `Kill Port ${port} & Restart`
                )}
              </button>
            </div>
          )}

          {errorType === "not_installed" && (
            <div className="mt-4 p-3 border border-border bg-accent-hover">
              <p className="text-xs text-muted mb-2">Install OpenCode:</p>
              <div className="space-y-2">
                <code className="block text-xs font-mono bg-background p-2 border border-border">
                  npm i -g opencode-ai@latest
                </code>
                <code className="block text-xs font-mono bg-background p-2 border border-border">
                  brew install sst/tap/opencode
                </code>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-muted">
            Copy this error and paste it to your local OpenCode or Claude for
            debugging assistance.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-accent-hover">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs border border-border hover:border-foreground transition-colors"
          >
            Dismiss
          </button>
          {errorType !== "port_in_use" && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 text-xs bg-background text-foreground border border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
