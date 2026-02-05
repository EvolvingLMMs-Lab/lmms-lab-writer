"use client";

import { useState, useCallback, useEffect, useMemo, memo } from "react";
import dynamic from "next/dynamic";
import type { PendingEdit } from "@/lib/opencode/types";
import {
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CheckCircleIcon,
  XIcon,
} from "@phosphor-icons/react";

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

interface ChangesReviewPanelProps {
  edits: PendingEdit[];
  onAccept: (editId: string) => void;
  onReject: (editId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onDismiss: () => void;
  className?: string;
}

export const ChangesReviewPanel = memo(function ChangesReviewPanel({
  edits,
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  onDismiss,
  className = "",
}: ChangesReviewPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Current edit being viewed
  const currentEdit = edits[currentIndex];
  const totalCount = edits.length;
  const pendingCount = edits.filter((e) => e.status === "pending").length;

  // Get file name from path
  const getFileName = (path: string) => path.split(/[/\\]/).pop() || path;

  // Navigate to next/previous file
  const goToNext = useCallback(() => {
    if (currentIndex < edits.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, edits.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Handle accept current file
  const handleAcceptCurrent = useCallback(async () => {
    if (!currentEdit || isProcessing) return;
    setIsProcessing(true);
    try {
      await onAccept(currentEdit.id);
      // Auto-advance to next pending edit if available
      const nextPendingIndex = edits.findIndex(
        (e, i) => i > currentIndex && e.status === "pending"
      );
      if (nextPendingIndex !== -1) {
        setCurrentIndex(nextPendingIndex);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [currentEdit, currentIndex, edits, isProcessing, onAccept]);

  // Handle reject current file
  const handleRejectCurrent = useCallback(async () => {
    if (!currentEdit || isProcessing) return;
    setIsProcessing(true);
    try {
      await onReject(currentEdit.id);
      // Auto-advance to next pending edit if available
      const nextPendingIndex = edits.findIndex(
        (e, i) => i > currentIndex && e.status === "pending"
      );
      if (nextPendingIndex !== -1) {
        setCurrentIndex(nextPendingIndex);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [currentEdit, currentIndex, edits, isProcessing, onReject]);

  // Handle accept all
  const handleAcceptAll = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onAcceptAll();
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onAcceptAll]);

  // Handle reject all
  const handleRejectAll = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onRejectAll();
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onRejectAll]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isProcessing) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          handleAcceptAll();
        } else {
          handleAcceptCurrent();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isProcessing,
    onDismiss,
    goToPrevious,
    goToNext,
    handleAcceptCurrent,
    handleAcceptAll,
  ]);

  // Calculate total additions/deletions
  const totalStats = useMemo(() => {
    return edits.reduce(
      (acc, edit) => ({
        additions: acc.additions + edit.additions,
        deletions: acc.deletions + edit.deletions,
      }),
      { additions: 0, deletions: 0 }
    );
  }, [edits]);

  if (!currentEdit) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-sm text-neutral-500">No changes to review</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-amber-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Review Changes
            </span>
          </div>
          <span className="text-xs text-amber-700 font-mono">
            {pendingCount} pending of {totalCount} files
          </span>
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {totalStats.additions > 0 && (
              <span className="text-green-600 font-medium">
                +{totalStats.additions}
              </span>
            )}
            {totalStats.deletions > 0 && (
              <span className="text-red-500 font-medium">
                -{totalStats.deletions}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 font-mono hidden sm:block">
            <kbd className="px-1 py-0.5 bg-white border border-neutral-300 rounded text-[9px]">
              Esc
            </kbd>{" "}
            close ·{" "}
            <kbd className="px-1 py-0.5 bg-white border border-neutral-300 rounded text-[9px]">
              ←→
            </kbd>{" "}
            navigate
          </span>
          <button
            onClick={onDismiss}
            disabled={isProcessing}
            className="px-3 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* File list sidebar */}
        <div className="w-48 border-r border-neutral-200 flex flex-col bg-neutral-50">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-neutral-500 font-medium border-b border-neutral-200">
            Changed Files
          </div>
          <div className="flex-1 overflow-y-auto">
            {edits.map((edit, index) => (
              <button
                key={edit.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-full text-left px-3 py-2 text-xs font-mono border-b border-neutral-100 transition-colors ${
                  index === currentIndex
                    ? "bg-white border-l-2 border-l-amber-500"
                    : "hover:bg-white"
                } ${
                  edit.status === "accepted"
                    ? "text-green-700"
                    : edit.status === "rejected"
                      ? "text-red-600 line-through"
                      : "text-neutral-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {edit.status === "accepted" && (
                    <CheckIcon className="w-3 h-3 text-green-600 flex-shrink-0" />
                  )}
                  {edit.status === "rejected" && (
                    <XIcon className="w-3 h-3 text-red-500 flex-shrink-0" />
                  )}
                  {edit.status === "pending" && (
                    <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                  )}
                  <span className="truncate">{getFileName(edit.filePath)}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                  {edit.additions > 0 && (
                    <span className="text-green-600">+{edit.additions}</span>
                  )}
                  {edit.deletions > 0 && (
                    <span className="text-red-500">-{edit.deletions}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Batch actions */}
          <div className="p-2 border-t border-neutral-200 space-y-1.5">
            <button
              onClick={handleAcceptAll}
              disabled={isProcessing || pendingCount === 0}
              className="w-full px-2 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded transition-colors disabled:opacity-50"
            >
              Accept All ({pendingCount})
            </button>
            <button
              onClick={handleRejectAll}
              disabled={isProcessing || pendingCount === 0}
              className="w-full px-2 py-1.5 text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded transition-colors disabled:opacity-50"
            >
              Reject All
            </button>
          </div>
        </div>

        {/* Diff editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Current file header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0 || isProcessing}
                  className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <CaretLeftIcon className="w-4 h-4" />
                </button>
                <span className="text-xs text-neutral-500 font-mono tabular-nums">
                  {currentIndex + 1} / {totalCount}
                </span>
                <button
                  onClick={goToNext}
                  disabled={currentIndex === edits.length - 1 || isProcessing}
                  className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <CaretRightIcon className="w-4 h-4" />
                </button>
              </div>
              <span className="text-sm font-mono text-neutral-700 truncate">
                {currentEdit.filePath}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono flex-shrink-0">
                {currentEdit.additions > 0 && (
                  <span className="text-green-600">
                    +{currentEdit.additions}
                  </span>
                )}
                {currentEdit.deletions > 0 && (
                  <span className="text-red-500">-{currentEdit.deletions}</span>
                )}
              </div>
            </div>

            {/* Current file actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentEdit.status === "pending" ? (
                <>
                  <button
                    onClick={handleRejectCurrent}
                    disabled={isProcessing}
                    className="px-3 py-1 text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 rounded transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleAcceptCurrent}
                    disabled={isProcessing}
                    className="px-3 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 rounded transition-colors disabled:opacity-50"
                  >
                    Accept
                  </button>
                </>
              ) : (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    currentEdit.status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {currentEdit.status === "accepted" ? "Accepted" : "Rejected"}
                </span>
              )}
            </div>
          </div>

          {/* Monaco Diff Editor */}
          <div className="flex-1 min-h-0">
            <MonacoDiffEditor
              original={currentEdit.before}
              modified={currentEdit.after}
              filePath={currentEdit.filePath}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
