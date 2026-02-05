"use client";

import { useState } from "react";
import { FolderIcon, TrashIcon } from "@phosphor-icons/react";
import type { RecentProject } from "@/lib/recent-projects";
import { formatRelativeTime } from "./opencode/utils";

export function RecentProjects({
  projects,
  onSelect,
  onRemove,
  onClearAll,
}: {
  projects: RecentProject[];
  onSelect: (path: string) => void;
  onRemove: (path: string) => void;
  onClearAll: () => void;
}) {
  const [deleteConfirmPath, setDeleteConfirmPath] = useState<string | null>(
    null
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 w-full max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted">Recent Projects</h3>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="text-xs text-muted hover:text-black transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="border border-border bg-white">
        {projects.map((project) => {
          const timeStr = formatRelativeTime(new Date(project.lastOpened));
          return (
            <div
              key={project.path}
              className="flex items-center border-b border-border last:border-b-0 hover:bg-neutral-50 transition-colors"
            >
              <button
                onClick={() => onSelect(project.path)}
                className="flex-1 text-left px-3 py-2.5 flex items-center gap-3 min-w-0"
              >
                <FolderIcon className="size-4 text-muted flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{project.name}</p>
                  <p className="text-xs text-muted truncate">{project.path}</p>
                </div>
                <span className="text-xs text-muted flex-shrink-0">
                  {timeStr}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmPath(project.path);
                }}
                className="px-3 py-2 text-muted hover:text-red-600 transition-colors"
                title="Remove from history"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>
          );
        })}
      </div>

      {deleteConfirmPath && (
        <ConfirmDialog
          message="Remove this project from history?"
          onConfirm={() => {
            onRemove(deleteConfirmPath);
            setDeleteConfirmPath(null);
          }}
          onCancel={() => setDeleteConfirmPath(null)}
        />
      )}

      {showClearConfirm && (
        <ConfirmDialog
          message="Clear all recent projects?"
          onConfirm={() => {
            onClearAll();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border border-border p-4 max-w-xs w-full mx-4 shadow-[4px_4px_0_0_#000]">
        <p className="text-sm mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-border hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-brutalist text-sm">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
