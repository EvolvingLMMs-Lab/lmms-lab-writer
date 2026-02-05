"use client";

import { useState } from "react";
import type { RecentProject } from "@/lib/recent-projects";
import { formatRelativeTime } from "./opencode/utils";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
      />
    </svg>
  );
}

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
