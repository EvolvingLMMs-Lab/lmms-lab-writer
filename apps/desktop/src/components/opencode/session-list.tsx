"use client";

import { useState, useMemo } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { SessionInfo } from "@/lib/opencode/types";
import { TrashIcon } from "./icons";
import { formatRelativeTime } from "./utils";

export function SessionList({
  sessions,
  currentSessionId,
  onSelect,
  onNewSession,
  onDelete,
}: {
  sessions: SessionInfo[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onNewSession: () => void;
  onDelete: (id: string) => void;
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [listParent] = useAutoAnimate({ duration: 200 });
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.time.updated - a.time.updated),
    [sessions],
  );

  if (sortedSessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-muted">No sessions yet</p>
          <button onClick={onNewSession} className="btn-brutalist">
            Create First Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={listParent} className="flex-1 min-h-0 overflow-y-auto">
      {sortedSessions.map((session) => {
        const isActive = session.id === currentSessionId;
        const timeStr = formatRelativeTime(new Date(session.time.updated));

        return (
          <div
            key={session.id}
            className={`w-full flex items-center border-b border-border hover:bg-accent-hover transition-colors ${isActive ? "bg-surface-secondary" : ""}`}
          >
            <button
              onClick={() => onSelect(session.id)}
              className="flex-1 text-left px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">
                    {session.title || "Untitled"}
                  </p>
                  {session.summary?.files !== undefined && (
                    <p className="text-xs text-muted mt-0.5">
                      {session.summary.files} file
                      {session.summary.files !== 1 ? "s" : ""} modified
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted flex-shrink-0">
                  {timeStr}
                </span>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirmId(session.id);
              }}
              className="px-3 py-2 text-muted hover:text-red-600 transition-colors"
              title="Delete session"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>
        );
      })}

      {deleteConfirmId && (
        <ConfirmDialog
          message="Delete this session? This cannot be undone."
          onConfirm={() => {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <p className="text-sm text-muted">Send a message to get started</p>
    </div>
  );
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50">
      <div className="bg-background border border-border p-4 max-w-xs w-full mx-4 shadow-[4px_4px_0_0_var(--foreground)]">
        <p className="text-sm mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-border hover:bg-surface-secondary transition-colors"
          >
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-brutalist text-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
