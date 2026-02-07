"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

interface GitHubPublishDialogProps {
  defaultRepoName: string;
  onPublish: (name: string, isPrivate: boolean, description: string) => void;
  onCancel: () => void;
  isCreating: boolean;
  error: string | null;
}

export function GitHubPublishDialog({
  defaultRepoName,
  onPublish,
  onCancel,
  isCreating,
  error,
}: GitHubPublishDialogProps) {
  const [repoName, setRepoName] = useState(defaultRepoName);
  const [isPrivate, setIsPrivate] = useState(true);
  const [description, setDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!repoName.trim() || isCreating) return;
    onPublish(repoName.trim(), isPrivate, description.trim());
  }, [repoName, isPrivate, description, isCreating, onPublish]);

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-foreground/30"
          onClick={isCreating ? undefined : onCancel}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 6 }}
          transition={{ duration: 0.12 }}
          className="relative z-10 w-full max-w-sm border border-foreground bg-background text-foreground shadow-[3px_3px_0_var(--foreground)]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border">
            <h3 id={titleId} className="text-sm font-medium">
              Publish to GitHub
            </h3>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-4">
            {/* Repo name */}
            <div>
              <label className="block text-xs font-mono text-muted mb-1.5">
                Repository name
              </label>
              <input
                ref={inputRef}
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-project"
                disabled={isCreating}
                className="w-full px-3 py-2 text-sm border border-border outline-none focus:border-foreground transition-colors disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                  if (e.key === "Escape" && !isCreating) {
                    e.preventDefault();
                    onCancel();
                  }
                }}
              />
            </div>

            {/* Visibility toggle */}
            <div>
              <label className="block text-xs font-mono text-muted mb-1.5">
                Visibility
              </label>
              <div className="flex border border-border">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  disabled={isCreating}
                  className={`flex-1 text-xs font-mono py-2 transition-colors ${
                    !isPrivate
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground hover:bg-accent-hover"
                  } disabled:opacity-50`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  disabled={isCreating}
                  className={`flex-1 text-xs font-mono py-2 border-l border-border transition-colors ${
                    isPrivate
                      ? "bg-foreground text-background"
                      : "bg-background text-foreground hover:bg-accent-hover"
                  } disabled:opacity-50`}
                >
                  Private
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-mono text-muted mb-1.5">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description..."
                disabled={isCreating}
                className="w-full px-3 py-2 text-sm border border-border outline-none focus:border-foreground transition-colors disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSubmit();
                  }
                  if (e.key === "Escape" && !isCreating) {
                    e.preventDefault();
                    onCancel();
                  }
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
            <button
              type="button"
              onClick={onCancel}
              disabled={isCreating}
              className="btn btn-sm btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!repoName.trim() || isCreating}
              className="btn btn-sm btn-primary flex items-center gap-1.5 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Spinner className="size-3" />
                  Creating...
                </>
              ) : (
                "Create & Push"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body,
  );
}
