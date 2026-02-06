"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { GitFileChange, GitStatus } from "@lmms-lab/writer-shared";
import { ArrowClockwiseIcon, GitBranchIcon } from "@phosphor-icons/react";

type GitSidebarPanelProps = {
  projectPath: string | null;
  gitStatus: GitStatus | null;
  stagedChanges: GitFileChange[];
  unstagedChanges: GitFileChange[];
  showRemoteInput: boolean;
  remoteUrl: string;
  onRemoteUrlChange: (value: string) => void;
  onShowRemoteInput: () => void;
  onHideRemoteInput: () => void;
  onSubmitRemote: () => void;
  onInitGit: () => void;
  isInitializingGit: boolean;
  onRefreshStatus: () => void;
  onStageAll: () => void;
  onStageFile: (path: string) => void;
  showCommitInput: boolean;
  commitMessage: string;
  onCommitMessageChange: (value: string) => void;
  onShowCommitInput: () => void;
  onHideCommitInput: () => void;
  onCommit: () => void;
  onPush: () => void | Promise<void>;
  onPull: () => void | Promise<void>;
  isPushing: boolean;
  isPulling: boolean;
};

export function GitSidebarPanel({
  projectPath,
  gitStatus,
  stagedChanges,
  unstagedChanges,
  showRemoteInput,
  remoteUrl,
  onRemoteUrlChange,
  onShowRemoteInput,
  onHideRemoteInput,
  onSubmitRemote,
  onInitGit,
  isInitializingGit,
  onRefreshStatus,
  onStageAll,
  onStageFile,
  showCommitInput,
  commitMessage,
  onCommitMessageChange,
  onShowCommitInput,
  onHideCommitInput,
  onCommit,
  onPush,
  onPull,
  isPushing,
  isPulling,
}: GitSidebarPanelProps) {
  if (!projectPath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-muted">
        <GitBranchIcon className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-xs">No folder open</p>
      </div>
    );
  }

  if (!gitStatus?.isRepo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-muted">
        <GitBranchIcon className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-xs mb-3">Not a git repository</p>
        <button
          onClick={onInitGit}
          disabled={isInitializingGit}
          className="btn btn-sm btn-primary"
        >
          {isInitializingGit ? "Initializing..." : "Init Git"}
        </button>
      </div>
    );
  }

  const changeCount = gitStatus.changes.length;

  return (
    <>
      <div className="px-3 py-2 border-b border-border bg-neutral-50">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{gitStatus.branch}</span>
          <button
            onClick={onRefreshStatus}
            className="text-muted hover:text-black"
            aria-label="Refresh git status"
          >
            <ArrowClockwiseIcon className="w-4 h-4" />
          </button>
        </div>
        {!gitStatus.remote && (
          <div className="mt-2">
            {showRemoteInput ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={remoteUrl}
                  onChange={(e) => onRemoteUrlChange(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  className="w-full px-2 py-1 text-xs border border-border focus:outline-none focus:border-black"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && remoteUrl.trim()) {
                      onSubmitRemote();
                    }
                    if (e.key === "Escape") {
                      onHideRemoteInput();
                    }
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={onShowRemoteInput}
                className="text-xs text-black hover:underline"
              >
                + Connect to GitHub
              </button>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {stagedChanges.length > 0 && (
          <div className="border-b border-border">
            <div className="px-3 py-1 bg-neutral-50 text-xs font-medium uppercase tracking-wider text-muted">
              Staged ({stagedChanges.length})
            </div>
            {stagedChanges.map((c) => (
              <div
                key={c.path}
                className="px-3 py-1 text-sm flex items-center gap-2"
              >
                <span className="font-mono text-xs text-green-700">
                  {c.status[0]?.toUpperCase()}
                </span>
                <span className="truncate">{c.path}</span>
              </div>
            ))}
          </div>
        )}
        {unstagedChanges.length > 0 && (
          <div className="border-b border-border">
            <div className="px-3 py-1 bg-neutral-50 text-xs font-medium uppercase tracking-wider text-muted flex justify-between">
              <span>Changes ({unstagedChanges.length})</span>
              <button
                onClick={onStageAll}
                className="text-black hover:underline normal-case tracking-normal font-normal"
              >
                Stage all
              </button>
            </div>
            {unstagedChanges.map((c) => (
              <div
                key={c.path}
                className="px-3 py-1 text-sm flex items-center gap-2 group"
              >
                <span className="font-mono text-xs text-muted">
                  {c.status[0]?.toUpperCase()}
                </span>
                <span className="truncate flex-1">{c.path}</span>
                <button
                  onClick={() => onStageFile(c.path)}
                  className="opacity-0 group-hover:opacity-100 text-xs"
                  aria-label="Stage file"
                >
                  +
                </button>
              </div>
            ))}
          </div>
        )}
        {changeCount === 0 && (
          <div className="px-3 py-8 text-center text-muted text-sm">
            No changes
          </div>
        )}
      </ScrollArea>

      {showCommitInput && stagedChanges.length > 0 && (
        <div className="border-t border-border p-3 space-y-2">
          <textarea
            value={commitMessage}
            onChange={(e) => onCommitMessageChange(e.target.value)}
            placeholder="Commit message..."
            className="w-full px-2 py-1 text-sm border border-border resize-none focus:outline-none focus:border-black"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                onCommit();
              }
            }}
          />
          <div className="flex justify-between items-center">
            <button
              onClick={onHideCommitInput}
              className="text-xs text-muted hover:text-black"
            >
              Cancel
            </button>
            <button
              onClick={onCommit}
              disabled={!commitMessage.trim()}
              className="btn btn-sm btn-primary"
            >
              Commit
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-border p-3 flex items-center gap-2">
        {stagedChanges.length > 0 && !showCommitInput && (
          <button
            onClick={onShowCommitInput}
            className="btn btn-sm btn-primary flex-1"
          >
            Commit ({stagedChanges.length})
          </button>
        )}
        {gitStatus.ahead > 0 && (
          <button
            onClick={() => {
              void onPush();
            }}
            disabled={isPushing}
            className="btn btn-sm btn-secondary flex-1 flex items-center justify-center gap-1.5"
          >
            {isPushing ? (
              <>
                <Spinner className="size-3" />
                <span>Pushing...</span>
              </>
            ) : (
              `Push (${gitStatus.ahead})`
            )}
          </button>
        )}
        {gitStatus.behind > 0 && (
          <button
            onClick={() => {
              void onPull();
            }}
            disabled={isPulling}
            className="btn btn-sm btn-secondary flex-1 flex items-center justify-center gap-1.5"
          >
            {isPulling ? (
              <>
                <Spinner className="size-3" />
                <span>Pulling...</span>
              </>
            ) : (
              `Pull (${gitStatus.behind})`
            )}
          </button>
        )}
      </div>
    </>
  );
}
