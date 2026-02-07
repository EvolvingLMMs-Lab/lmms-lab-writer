"use client";

import { useCallback, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { GitFileChange, GitStatus } from "@lmms-lab/writer-shared";
import { ArrowClockwiseIcon, GitBranchIcon } from "@phosphor-icons/react";

type SelectedChange = {
  path: string;
  staged: boolean;
};

const STATUS_SHORT: Record<GitFileChange["status"], string> = {
  modified: "M",
  added: "A",
  deleted: "D",
  renamed: "R",
  untracked: "?",
};

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
  onPreviewDiff: (path: string, staged: boolean) => void | Promise<void>;
  onGenerateCommitMessageAI: () => void | Promise<void>;
  onOpenFile?: (path: string) => void | Promise<void>;
  isGeneratingCommitMessageAI: boolean;
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
  onPreviewDiff,
  onGenerateCommitMessageAI,
  onOpenFile,
  isGeneratingCommitMessageAI,
  isPushing,
  isPulling,
}: GitSidebarPanelProps) {
  const [selectedChange, setSelectedChange] = useState<SelectedChange | null>(
    null,
  );

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

  const handleSelectChange = useCallback((path: string, staged: boolean) => {
    setSelectedChange({ path, staged });
    void onPreviewDiff(path, staged);
  }, [onPreviewDiff]);

  const handleOpenSelectedFile = useCallback(() => {
    if (!selectedChange || !onOpenFile) return;
    void onOpenFile(selectedChange.path);
  }, [onOpenFile, selectedChange]);

  const renderChangeRow = useCallback(
    (change: GitFileChange, staged: boolean) => {
      const isSelected =
        selectedChange?.path === change.path && selectedChange.staged === staged;
      return (
        <div
          key={`${staged ? "staged" : "unstaged"}:${change.path}`}
          className={`flex items-stretch border-b border-border ${
            isSelected ? "bg-neutral-100" : "bg-white"
          }`}
        >
          <button
            type="button"
            onClick={() => handleSelectChange(change.path, staged)}
            className="flex-1 min-w-0 px-3 py-2 text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-5 h-5 border border-border text-[11px] font-mono flex items-center justify-center">
                {STATUS_SHORT[change.status]}
              </span>
              <span className="truncate text-sm">{change.path}</span>
            </div>
          </button>
          {!staged && (
            <button
              type="button"
              onClick={() => onStageFile(change.path)}
              className="w-8 border-l border-border text-sm hover:bg-neutral-100"
              aria-label={`Stage ${change.path}`}
            >
              +
            </button>
          )}
        </div>
      );
    },
    [handleSelectChange, onStageFile, selectedChange],
  );

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
        <div className="mt-1 text-xs text-muted">
          {changeCount} changed
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

      <div className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 min-h-0">
          {unstagedChanges.length > 0 && (
            <div className="border-b border-border">
              <div className="px-3 py-1.5 bg-neutral-50 text-xs font-medium text-muted flex items-center justify-between">
                <span>Changes ({unstagedChanges.length})</span>
                <button
                  type="button"
                  onClick={onStageAll}
                  className="normal-case tracking-normal font-normal text-black hover:underline"
                >
                  Stage all
                </button>
              </div>
              {unstagedChanges.map((change) => renderChangeRow(change, false))}
            </div>
          )}

          {stagedChanges.length > 0 && (
            <div className="border-b border-border">
              <div className="px-3 py-1.5 bg-neutral-50 text-xs font-medium text-muted">
                Staged ({stagedChanges.length})
              </div>
              {stagedChanges.map((change) => renderChangeRow(change, true))}
            </div>
          )}

          {changeCount === 0 && (
            <div className="px-3 py-8 text-center text-muted text-sm">
              No changes
            </div>
          )}
        </ScrollArea>

        {selectedChange && (
          <div className="border-t border-border px-3 py-2 bg-neutral-50 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">
                Inspecting: {selectedChange.path}
              </div>
              <div className="text-[11px] text-muted">
                Diff is shown in the editor panel
              </div>
            </div>
            {onOpenFile && (
                <button
                  type="button"
                  onClick={handleOpenSelectedFile}
                  className="btn btn-sm btn-secondary"
                >
                  Open File
                </button>
              )}
          </div>
        )}
      </div>

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
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onHideCommitInput}
              className="text-xs text-muted hover:text-black"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  void onGenerateCommitMessageAI();
                }}
                disabled={isGeneratingCommitMessageAI}
                className="btn btn-sm btn-secondary"
              >
                {isGeneratingCommitMessageAI ? "AI..." : "AI Draft"}
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
