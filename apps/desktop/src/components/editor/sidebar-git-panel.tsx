"use client";

import { useCallback, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import type {
  GitFileChange,
  GitLogEntry,
  GitStatus,
} from "@lmms-lab/writer-shared";
import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  GitBranchIcon,
  ClockCounterClockwiseIcon,
  MinusIcon,
  PlusIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  GlobeIcon,
  SparkleIcon,
  FileIcon,
  GitCommitIcon,
  CopyIcon,
} from "@phosphor-icons/react";

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

const STATUS_STYLE: Record<GitFileChange["status"], string> = {
  modified: "bg-neutral-900 text-white",
  added: "bg-neutral-700 text-white",
  deleted: "bg-neutral-400 text-white",
  renamed: "bg-neutral-600 text-white",
  untracked: "bg-neutral-200 text-neutral-600",
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 5) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
}

function CommitEntry({
  entry,
  isFirst,
  isLast,
}: {
  entry: GitLogEntry;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyHash = useCallback(() => {
    void navigator.clipboard.writeText(entry.shortHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [entry.shortHash]);

  return (
    <div className="group flex gap-2.5 px-3 hover:bg-neutral-50 transition-colors">
      {/* Timeline */}
      <div className="flex flex-col items-center w-3 flex-shrink-0">
        {!isFirst && <div className="w-px flex-1 bg-neutral-200" />}
        <div className="w-[7px] h-[7px] rounded-full bg-neutral-800 border-2 border-white ring-1 ring-neutral-300 flex-shrink-0 my-0.5" />
        {!isLast && <div className="w-px flex-1 bg-neutral-200" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-2">
        <p className="text-xs font-mono leading-relaxed truncate text-foreground">
          {entry.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={handleCopyHash}
            className="flex items-center gap-1 text-[10px] font-mono text-muted hover:text-black transition-colors group/hash"
            title={`Copy hash: ${entry.hash}`}
          >
            <span className="bg-neutral-100 px-1 py-px group-hover/hash:bg-neutral-200 transition-colors">
              {entry.shortHash}
            </span>
            {copied ? (
              <CheckIcon className="w-2.5 h-2.5 text-black" />
            ) : (
              <CopyIcon className="w-2.5 h-2.5 opacity-0 group-hover/hash:opacity-100 transition-opacity" />
            )}
          </button>
          <span className="text-[10px] font-mono text-neutral-300">
            {entry.author}
          </span>
          <span className="text-[10px] font-mono text-neutral-300 ml-auto flex-shrink-0">
            {formatRelativeDate(entry.date)}
          </span>
        </div>
      </div>
    </div>
  );
}

type GitSidebarPanelProps = {
  projectPath: string | null;
  gitStatus: GitStatus | null;
  gitGraph: string[];
  gitLogEntries: GitLogEntry[];
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
  onDiscardAll: () => void | Promise<void>;
  onDiscardFile: (path: string) => void | Promise<void>;
  onStageFile: (path: string) => void;
  onUnstageFile: (path: string) => void;
  onUnstageAll: () => void;
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
  gitGraph,
  gitLogEntries,
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
  onDiscardAll,
  onDiscardFile,
  onStageFile,
  onUnstageFile,
  onUnstageAll,
  commitMessage,
  onCommitMessageChange,
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
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [showAllCommits, setShowAllCommits] = useState(false);
  const [showDiscardAllConfirm, setShowDiscardAllConfirm] = useState(false);

  const visibleCommits = useMemo(() => {
    if (showAllCommits) return gitLogEntries;
    return gitLogEntries.slice(0, 5);
  }, [gitLogEntries, showAllCommits]);

  const hasMoreCommits = gitLogEntries.length > 5;

  if (!projectPath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted">
        <div className="w-12 h-12 border-2 border-neutral-200 flex items-center justify-center mb-3">
          <GitBranchIcon className="w-6 h-6 opacity-30" />
        </div>
        <p className="text-xs font-mono uppercase tracking-wider">
          No folder open
        </p>
      </div>
    );
  }

  if (!gitStatus?.isRepo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted">
        <div className="w-12 h-12 border-2 border-neutral-200 flex items-center justify-center mb-3">
          <GitBranchIcon className="w-6 h-6 opacity-30" />
        </div>
        <p className="text-xs font-mono uppercase tracking-wider mb-4">
          Not a git repository
        </p>
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

  const handleSelectChange = useCallback(
    (path: string, staged: boolean) => {
      setSelectedChange({ path, staged });
      void onPreviewDiff(path, staged);
    },
    [onPreviewDiff],
  );

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
          className={`group flex items-stretch transition-colors duration-100 ${
            isSelected
              ? "bg-neutral-100 border-l-2 border-l-black"
              : "border-l-2 border-l-transparent hover:bg-neutral-50"
          }`}
        >
          <button
            type="button"
            onClick={() => handleSelectChange(change.path, staged)}
            className="flex-1 min-w-0 px-3 py-1.5 text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-[18px] h-[18px] text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0 ${STATUS_STYLE[change.status]}`}
              >
                {STATUS_SHORT[change.status]}
              </span>
              <span
                className={`truncate text-xs font-mono ${
                  change.status === "deleted"
                    ? "line-through text-muted"
                    : "text-foreground"
                }`}
              >
                {change.path}
              </span>
            </div>
          </button>
          <div className="flex items-stretch opacity-0 group-hover:opacity-100 transition-opacity duration-100">
            {!staged && (
              <button
                type="button"
                onClick={() => {
                  void onDiscardFile(change.path);
                }}
                className="w-7 flex items-center justify-center hover:bg-neutral-200"
                aria-label={`Discard ${change.path}`}
                title="Discard changes"
              >
                <ArrowCounterClockwiseIcon className="w-3 h-3" />
              </button>
            )}
            {staged ? (
              <button
                type="button"
                onClick={() => onUnstageFile(change.path)}
                className="w-7 flex items-center justify-center hover:bg-neutral-200"
                aria-label={`Unstage ${change.path}`}
                title="Unstage file"
              >
                <MinusIcon className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStageFile(change.path)}
                className="w-7 flex items-center justify-center hover:bg-neutral-200"
                aria-label={`Stage ${change.path}`}
                title="Stage file"
              >
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      );
    },
    [handleSelectChange, onStageFile, onDiscardFile, selectedChange],
  );

  return (
    <>
      {/* Discard all confirm dialog */}
      {showDiscardAllConfirm && (
        <ConfirmDialog
          title="Discard all changes"
          message={`This will discard all ${unstagedChanges.length} unstaged change${unstagedChanges.length > 1 ? "s" : ""}. This action cannot be undone.`}
          confirmLabel="Discard All"
          cancelLabel="Cancel"
          onConfirm={() => {
            void onDiscardAll();
            setShowDiscardAllConfirm(false);
          }}
          onCancel={() => setShowDiscardAllConfirm(false)}
        />
      )}

      {/* Header: branch + status */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranchIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-mono text-xs font-medium truncate">
              {gitStatus.branch}
            </span>
          </div>
          <button
            onClick={onRefreshStatus}
            className="p-1 text-muted hover:text-black hover:bg-black/5 transition-colors"
            aria-label="Refresh git status"
          >
            <ArrowClockwiseIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {!gitStatus.remote && (
          <div className="mt-2">
            {showRemoteInput ? (
              <input
                type="text"
                value={remoteUrl}
                onChange={(e) => onRemoteUrlChange(e.target.value)}
                placeholder="https://github.com/user/repo.git"
                className="w-full px-2 py-1.5 text-xs font-mono border-2 border-black focus:outline-none bg-white"
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
            ) : (
              <button
                onClick={onShowRemoteInput}
                className="flex items-center gap-1.5 text-[11px] font-mono text-muted hover:text-black transition-colors"
              >
                <GlobeIcon className="w-3 h-3" />
                <span>Connect remote</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Commit input area (always visible, like VS Code) */}
      <div className="px-3 py-2.5 border-b border-border space-y-2">
        <div className="relative">
          <textarea
            value={commitMessage}
            onChange={(e) => onCommitMessageChange(e.target.value)}
            placeholder="Message (Ctrl+Enter to commit)"
            className="w-full px-2.5 py-2 text-xs font-mono border border-border resize-none focus:outline-none focus:border-black bg-white placeholder:text-neutral-300 transition-colors"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                onCommit();
              }
            }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCommit}
            disabled={!commitMessage.trim() || stagedChanges.length === 0}
            className="flex-1 text-[11px] font-mono py-1.5 bg-black text-white border border-black hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-black transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckIcon className="w-3 h-3" />
            Commit
            {stagedChanges.length > 0 && (
              <span className="opacity-60">({stagedChanges.length})</span>
            )}
          </button>
          <button
            onClick={() => {
              void onGenerateCommitMessageAI();
            }}
            disabled={isGeneratingCommitMessageAI || stagedChanges.length === 0}
            className="text-[11px] font-mono px-2.5 py-1.5 border border-border hover:border-black hover:bg-neutral-50 disabled:opacity-30 disabled:hover:border-border disabled:hover:bg-white transition-colors flex items-center gap-1"
            title="AI Draft"
          >
            <SparkleIcon className="w-3 h-3" />
            {isGeneratingCommitMessageAI ? "..." : "AI"}
          </button>
          {gitStatus.ahead > 0 && (
            <button
              onClick={() => {
                void onPush();
              }}
              disabled={isPushing}
              className="text-[11px] font-mono px-2.5 py-1.5 border border-border hover:border-black hover:bg-neutral-50 disabled:opacity-30 transition-colors flex items-center gap-1"
              title={`Push ${gitStatus.ahead} commit${gitStatus.ahead > 1 ? "s" : ""}`}
            >
              {isPushing ? (
                <Spinner className="size-3" />
              ) : (
                <>
                  <ArrowUpIcon className="w-3 h-3" />
                  {gitStatus.ahead}
                </>
              )}
            </button>
          )}
          {gitStatus.behind > 0 && (
            <button
              onClick={() => {
                void onPull();
              }}
              disabled={isPulling}
              className="text-[11px] font-mono px-2.5 py-1.5 border border-border hover:border-black hover:bg-neutral-50 disabled:opacity-30 transition-colors flex items-center gap-1"
              title={`Pull ${gitStatus.behind} commit${gitStatus.behind > 1 ? "s" : ""}`}
            >
              {isPulling ? (
                <Spinner className="size-3" />
              ) : (
                <>
                  <ArrowDownIcon className="w-3 h-3" />
                  {gitStatus.behind}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content: Staged → Changes → History */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 min-h-0">
          {/* Staged Changes */}
          {stagedChanges.length > 0 && (
            <div className="border-b border-border">
              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted">
                <span className="flex items-center gap-1.5">
                  <CheckIcon className="w-3 h-3" />
                  Staged
                  <span className="inline-flex items-center justify-center w-4 h-4 bg-black text-white text-[9px] font-bold">
                    {stagedChanges.length}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={onUnstageAll}
                  className="normal-case tracking-normal text-muted hover:text-black transition-colors p-0.5"
                  title="Unstage all"
                >
                  <MinusIcon className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="border-t border-neutral-100">
                {stagedChanges.map((change) => renderChangeRow(change, true))}
              </div>
            </div>
          )}

          {/* Unstaged Changes */}
          {unstagedChanges.length > 0 && (
            <div className="border-b border-border">
              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted">
                <span className="flex items-center gap-1.5">
                  Changes
                  <span className="inline-flex items-center justify-center w-4 h-4 bg-neutral-900 text-white text-[9px] font-bold">
                    {unstagedChanges.length}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowDiscardAllConfirm(true)}
                    className="normal-case tracking-normal text-muted hover:text-black transition-colors p-0.5"
                    title="Discard all changes"
                  >
                    <ArrowCounterClockwiseIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onStageAll}
                    className="normal-case tracking-normal text-muted hover:text-black transition-colors p-0.5"
                    title="Stage all changes"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              </div>
              <div className="border-t border-neutral-100">
                {unstagedChanges.map((change) =>
                  renderChangeRow(change, false),
                )}
              </div>
            </div>
          )}

          {/* Clean state */}
          {changeCount === 0 && (
            <div className="px-3 py-8 text-center border-b border-border">
              <CheckIcon className="w-5 h-5 mx-auto mb-2 text-neutral-300" />
              <p className="text-[11px] font-mono text-muted uppercase tracking-wider">
                Working tree clean
              </p>
            </div>
          )}

          {/* History section */}
          <div>
            <button
              type="button"
              onClick={() => setHistoryCollapsed(!historyCollapsed)}
              className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted hover:bg-neutral-50 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <ClockCounterClockwiseIcon className="w-3 h-3" />
                History
                {gitLogEntries.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-0.5 bg-neutral-200 text-neutral-600 text-[9px] font-bold">
                    {gitLogEntries.length}
                  </span>
                )}
              </span>
              <span className="text-[10px]">
                {historyCollapsed ? "+" : "\u2212"}
              </span>
            </button>
            {!historyCollapsed && (
              <>
                {gitLogEntries.length > 0 ? (
                  <div className="border-t border-neutral-100">
                    {visibleCommits.map((entry, i) => (
                      <CommitEntry
                        key={entry.hash}
                        entry={entry}
                        isFirst={i === 0}
                        isLast={
                          i === visibleCommits.length - 1 && !hasMoreCommits
                        }
                      />
                    ))}
                    {hasMoreCommits && (
                      <button
                        type="button"
                        onClick={() => setShowAllCommits(!showAllCommits)}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[11px] font-mono text-muted hover:text-black hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex flex-col items-center w-3 flex-shrink-0">
                          <div className="w-px flex-1 bg-neutral-200" />
                          <GitCommitIcon className="w-3 h-3 text-neutral-300 flex-shrink-0" />
                        </div>
                        <span>
                          {showAllCommits
                            ? "Show less"
                            : `${gitLogEntries.length - 5} more commits...`}
                        </span>
                      </button>
                    )}
                  </div>
                ) : gitGraph.length > 0 ? (
                  <div className="px-3 py-2 overflow-x-auto border-t border-neutral-100">
                    <pre className="text-[11px] leading-[18px] font-mono whitespace-pre text-neutral-600">
                      {gitGraph.join("\n")}
                    </pre>
                  </div>
                ) : (
                  <div className="px-3 py-4 text-center">
                    <p className="text-[11px] font-mono text-muted">
                      No commits yet
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Selected file info */}
        {selectedChange && (
          <div className="border-t-2 border-black px-3 py-2 bg-neutral-50 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-mono font-medium truncate flex items-center gap-1.5">
                <FileIcon className="w-3 h-3 flex-shrink-0" />
                {selectedChange.path}
              </div>
              <div className="text-[10px] font-mono text-muted mt-0.5">
                Diff shown in editor
              </div>
            </div>
            {onOpenFile && (
              <button
                type="button"
                onClick={handleOpenSelectedFile}
                className="text-[11px] font-mono px-2 py-1 border border-black hover:bg-black hover:text-white transition-colors"
              >
                Open
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
