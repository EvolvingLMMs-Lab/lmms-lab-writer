"use client";

import { GitHubCommitResponse } from "@/lib/github/git-api";
import { GitConnection } from "@/hooks/use-git-sync";

type Props = {
  history: GitHubCommitResponse[];
  loading: boolean;
  onSync: () => void;
  isSyncing: boolean;
  connection: GitConnection | null;
  lastSyncAt: Date | null;
  error?: string | null;
};

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function GitHistoryPanel({
  history,
  loading,
  onSync,
  isSyncing,
  connection,
  lastSyncAt,
  error,
}: Props) {
  if (!connection) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted">
        <svg
          className="w-8 h-8 mb-2 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <p className="text-sm">No repository connected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Git History</h2>
          <div className="flex items-center gap-2">
            {lastSyncAt && (
              <span className="text-[10px] text-muted uppercase tracking-wider">
                Synced{" "}
                {lastSyncAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs truncate font-mono text-muted">
              {connection.owner}/{connection.repo}
            </div>
            <div className="text-xs truncate font-medium">
              {connection.branch}
            </div>
          </div>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-black text-white text-xs hover:bg-black/90 active:bg-black/80 transition-colors disabled:opacity-50 uppercase tracking-wider shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]"
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>

        {error && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 border border-red-100">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && history.length === 0 ? (
          <div className="p-4 text-center text-muted text-sm">
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="p-4 text-center text-muted text-sm">
            No commits found
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.map((commit) => (
              <div
                key={commit.sha}
                className="p-3 hover:bg-neutral-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-sm font-medium line-clamp-1 break-all">
                    {commit.commit.message.split("\n")[0]}
                  </div>
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono text-muted hover:text-black hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {commit.sha.substring(0, 7)}
                  </a>
                </div>

                <div className="flex items-center justify-between text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    {commit.author?.avatar_url && (
                      <img
                        src={commit.author.avatar_url}
                        alt=""
                        className="w-4 h-4 rounded-full border border-border grayscale"
                      />
                    )}
                    <span className="truncate max-w-[100px]">
                      {commit.commit.author.name}
                    </span>
                  </div>
                  <span className="whitespace-nowrap">
                    {formatTimeAgo(commit.commit.author.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
