"use client";

import { GitSyncStatus } from "@/hooks/use-git-sync";

type Props = {
  status: GitSyncStatus;
  lastSyncAt: Date | null;
  onClick: () => void;
  className?: string;
};

export function GitStatusIndicator({
  status,
  lastSyncAt,
  onClick,
  className = "",
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1 hover:bg-neutral-100 transition-colors ${className}`}
      title={
        status === "disconnected" ? "Connect Repository" : "View Git History"
      }
    >
      <div className="relative flex items-center justify-center">
        {status === "syncing" ? (
          <div className="w-2 h-2 rounded-full border border-black border-t-transparent animate-spin" />
        ) : (
          <div
            className={`w-2 h-2 rounded-full ${
              status === "disconnected"
                ? "bg-neutral-300"
                : status === "synced"
                  ? "bg-black"
                  : status === "pending"
                    ? "bg-neutral-500"
                    : status === "error"
                      ? "bg-red-500"
                      : "bg-neutral-300"
            }`}
          />
        )}
      </div>

      <span className="text-xs text-muted tabular-nums">
        {status === "disconnected"
          ? "Git"
          : status === "syncing"
            ? "Syncing..."
            : status === "pending"
              ? "Unsaved"
              : status === "error"
                ? "Error"
                : "Synced"}
      </span>
    </button>
  );
}
