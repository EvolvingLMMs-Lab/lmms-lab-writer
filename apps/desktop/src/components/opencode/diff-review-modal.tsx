"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import type { PendingEdit } from "@/lib/opencode/types";

const MonacoDiffEditor = dynamic(
  () =>
    import("@/components/editor/monaco-diff-editor").then(
      (m) => m.MonacoDiffEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-sm text-neutral-400">Loading diff editor...</div>
      </div>
    ),
  }
);

interface DiffReviewModalProps {
  edit: PendingEdit;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
}

export function DiffReviewModal({
  edit,
  onAccept,
  onReject,
  onDismiss,
}: DiffReviewModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const fileName = edit.filePath.split(/[/\\]/).pop() || edit.filePath;

  const handleAccept = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onAccept();
    } finally {
      setIsProcessing(false);
    }
  }, [onAccept]);

  const handleReject = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onReject();
    } finally {
      setIsProcessing(false);
    }
  }, [onReject]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleAccept();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProcessing, onDismiss, handleAccept]);

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40"
          onClick={onDismiss}
        />

        {/* Modal - Brutalist style */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-5xl h-[80vh] flex flex-col bg-white border-2 border-black shadow-[6px_6px_0_0_#000]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-neutral-50">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Review Changes
              </h3>
              <span className="text-xs font-mono bg-white px-2 py-1 border border-black">
                {fileName}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono">
                {edit.additions > 0 && (
                  <span className="text-green-600 font-medium">
                    +{edit.additions}
                  </span>
                )}
                {edit.deletions > 0 && (
                  <span className="text-red-500 font-medium">
                    -{edit.deletions}
                  </span>
                )}
              </div>
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-neutral-200 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Diff Editor */}
          <div className="flex-1 min-h-0">
            <MonacoDiffEditor
              original={edit.before}
              modified={edit.after}
              filePath={edit.filePath}
              className="h-full"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t-2 border-black bg-neutral-50">
            <div className="text-xs text-neutral-500 font-mono">
              <span className="hidden sm:inline">
                Press <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[10px]">Esc</kbd> to dismiss,{" "}
                <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[10px]">Cmd+Enter</kbd> to accept
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider border-2 border-black bg-white text-black shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider border-2 border-black bg-black text-white shadow-[3px_3px_0_0_#666] hover:shadow-[1px_1px_0_0_#666] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
