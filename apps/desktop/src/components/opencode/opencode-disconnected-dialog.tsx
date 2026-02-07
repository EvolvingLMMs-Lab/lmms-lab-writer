"use client";

import { useCallback, useEffect, useRef } from "react";
import { WarningIcon, XIcon } from "@phosphor-icons/react";

type Props = {
  open: boolean;
  onClose: () => void;
  onRestart: () => void;
};

export function OpenCodeDisconnectedDialog({
  open,
  onClose,
  onRestart,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

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

  const handleRestart = useCallback(() => {
    onRestart();
    onClose();
  }, [onRestart, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        className="absolute inset-0 bg-foreground/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        className="relative bg-background border border-foreground w-full max-w-sm mx-4 shadow-[3px_3px_0_var(--foreground)]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 id="dialog-title" className="text-sm font-medium">
            OpenCode Disconnected
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
              <WarningIcon className="size-5 text-muted" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                The connection to OpenCode has been lost and could not be
                re-established.
              </p>
              <p className="text-xs text-muted mt-2">
                Please restart OpenCode to continue using AI features.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border bg-accent-hover">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs border border-border hover:border-foreground transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={handleRestart}
            className="px-3 py-1.5 text-xs bg-background text-foreground border border-foreground shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Restart OpenCode
          </button>
        </div>
      </div>
    </div>
  );
}
