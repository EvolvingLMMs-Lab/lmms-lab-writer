"use client";

import { useState, useCallback, useEffect, memo } from "react";
import dynamic from "next/dynamic";
import type { PendingEdit } from "@/lib/opencode/types";
import { PencilSimple } from "@phosphor-icons/react";

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

interface InlineDiffReviewProps {
  edit: PendingEdit;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
  className?: string;
}

export const InlineDiffReview = memo(function InlineDiffReview({
  edit,
  onAccept,
  onReject,
  onDismiss,
  className = "",
}: InlineDiffReviewProps) {
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

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header bar with file info and actions */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-amber-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <PencilSimple className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Review AI Changes
            </span>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 bg-white border border-amber-200 text-amber-700 rounded">
            {fileName}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-mono">
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
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 font-mono hidden sm:block">
            <kbd className="px-1 py-0.5 bg-white border border-neutral-300 rounded text-[9px]">
              Esc
            </kbd>{" "}
            dismiss ·{" "}
            <kbd className="px-1 py-0.5 bg-white border border-neutral-300 rounded text-[9px]">
              ⌘↵
            </kbd>{" "}
            accept
          </span>
          <button
            onClick={onDismiss}
            disabled={isProcessing}
            className="px-3 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors disabled:opacity-50"
          >
            Dismiss
          </button>
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="px-3 py-1 text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded transition-colors disabled:opacity-50"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="px-3 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded transition-colors disabled:opacity-50"
          >
            Accept
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
    </div>
  );
});
