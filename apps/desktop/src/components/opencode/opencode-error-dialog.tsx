"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

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
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="relative bg-white border border-black w-full max-w-md mx-4 shadow-lg"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 id="error-dialog-title" className="text-sm font-medium">
            OpenCode Error
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-muted hover:text-black transition-colors"
            aria-label="Close dialog"
          >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="size-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
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
            <div className="bg-neutral-100 border border-border p-3 text-xs font-mono break-all max-h-32 overflow-y-auto">
              {error}
            </div>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 px-2 py-1 text-xs bg-white border border-border hover:border-black transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {errorType === "port_in_use" && onKillPort && (
            <div className="mt-4 p-3 border border-border bg-neutral-50">
              <p className="text-xs text-muted mb-2">
                Would you like to automatically kill the process using port{" "}
                {port} and restart OpenCode?
              </p>
              <button
                onClick={handleKillPort}
                disabled={killing}
                className="w-full px-3 py-2 text-xs bg-white text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-x-0 disabled:translate-y-0"
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
            <div className="mt-4 p-3 border border-border bg-neutral-50">
              <p className="text-xs text-muted mb-2">Install OpenCode:</p>
              <div className="space-y-2">
                <code className="block text-xs font-mono bg-white p-2 border border-border">
                  npm i -g opencode-ai@latest
                </code>
                <code className="block text-xs font-mono bg-white p-2 border border-border">
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

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-neutral-50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs border border-border hover:border-black transition-colors"
          >
            Dismiss
          </button>
          {errorType !== "port_in_use" && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 text-xs bg-white text-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
