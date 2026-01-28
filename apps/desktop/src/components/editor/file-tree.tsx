"use client";

import { useState, useCallback, memo, useRef, useEffect, useMemo } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FileNode } from "@lmms-lab/writer-shared";

const ITEM_SPRING = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
} as const;

type Props = {
  files: FileNode[];
  onFileSelect?: (path: string) => void;
  selectedFile?: string;
  highlightedFile?: string | null;
  className?: string;
};

// Helper to check if a path is an ancestor of another
function isAncestorPath(ancestor: string, descendant: string): boolean {
  return descendant.startsWith(ancestor + "/");
}

function FileIcon({
  type,
  expanded,
}: {
  type: "file" | "directory";
  expanded?: boolean;
}) {
  if (type === "directory") {
    return expanded ? (
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth={1.5}
          d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth={1.5}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="w-4 h-4 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

const TreeNode = memo(function TreeNode({
  node,
  depth,
  onFileSelect,
  selectedFile,
  highlightedFile,
  defaultExpanded = false,
  focusedPath,
  onExpandedChange,
}: {
  node: FileNode;
  depth: number;
  onFileSelect?: (path: string) => void;
  selectedFile?: string;
  highlightedFile?: string | null;
  defaultExpanded?: boolean;
  focusedPath?: string | null;
  onExpandedChange?: (path: string, expanded: boolean) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isDirectory = node.type === "directory";
  const isHighlighted = highlightedFile === node.path;
  const isFocused = focusedPath === node.path;
  const shouldAutoExpand =
    isDirectory &&
    !!highlightedFile &&
    isAncestorPath(node.path, highlightedFile);

  const [expanded, setExpanded] = useState<boolean>(
    defaultExpanded || depth === 0 || shouldAutoExpand,
  );
  const isSelected = selectedFile === node.path;

  useEffect(() => {
    if (shouldAutoExpand && !expanded) {
      setExpanded(true);
      onExpandedChange?.(node.path, true);
    }
  }, [shouldAutoExpand, expanded, node.path, onExpandedChange]);

  useEffect(() => {
    if (isHighlighted && buttonRef.current) {
      buttonRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isHighlighted]);

  const handleClick = useCallback(() => {
    if (isDirectory) {
      setExpanded((prev) => {
        const newExpanded = !prev;
        onExpandedChange?.(node.path, newExpanded);
        return newExpanded;
      });
    } else {
      onFileSelect?.(node.path);
    }
  }, [isDirectory, node.path, onFileSelect, onExpandedChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick],
  );

  return (
    <div>
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="treeitem"
        aria-expanded={isDirectory ? expanded : undefined}
        aria-selected={isSelected}
        tabIndex={-1}
        data-path={node.path}
        className={`w-full flex items-center gap-2 px-2 py-1 text-left text-sm transition-colors ${
          isSelected
            ? "bg-black text-white"
            : isFocused
              ? "bg-black/10"
              : "hover:bg-black/5"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        whileTap={{ scale: 0.98 }}
        initial={false}
        animate={
          isHighlighted && !isSelected
            ? {
                backgroundColor: [
                  "rgba(0, 0, 0, 0)",
                  "rgba(0, 0, 0, 0.15)",
                  "rgba(0, 0, 0, 0)",
                  "rgba(0, 0, 0, 0.15)",
                  "rgba(0, 0, 0, 0)",
                ],
                transition: { duration: 1.5, ease: "easeInOut" },
              }
            : {}
        }
      >
        {isDirectory && (
          <motion.div
            className="w-3 h-3 flex-shrink-0"
            initial={false}
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
        )}
        {!isDirectory && <span className="w-3" />}
        <FileIcon type={node.type} expanded={expanded} />
        <span className="truncate">{node.name}</span>
      </motion.button>

      <AnimatePresence initial={false}>
        {isDirectory && expanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                highlightedFile={highlightedFile}
                focusedPath={focusedPath}
                onExpandedChange={onExpandedChange}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function flattenVisibleNodes(
  nodes: FileNode[],
  expandedPaths: Set<string>,
  depth = 0,
): Array<{ node: FileNode; depth: number }> {
  const result: Array<{ node: FileNode; depth: number }> = [];

  for (const node of nodes) {
    result.push({ node, depth });

    if (
      node.type === "directory" &&
      node.children &&
      expandedPaths.has(node.path)
    ) {
      result.push(
        ...flattenVisibleNodes(node.children, expandedPaths, depth + 1),
      );
    }
  }

  return result;
}

function getParentPath(path: string): string | null {
  const lastSlash = path.lastIndexOf("/");
  return lastSlash > 0 ? path.substring(0, lastSlash) : null;
}

export const FileTree = memo(function FileTree({
  files,
  onFileSelect,
  selectedFile,
  highlightedFile,
  className = "",
}: Props) {
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    files.forEach((node) => {
      if (node.type === "directory") {
        initial.add(node.path);
      }
    });
    return initial;
  });

  const visibleItems = useMemo(
    () => flattenVisibleNodes(files, expandedPaths),
    [files, expandedPaths],
  );

  const handleExpandedChange = useCallback(
    (path: string, expanded: boolean) => {
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        if (expanded) {
          next.add(path);
        } else {
          next.delete(path);
        }
        return next;
      });
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (visibleItems.length === 0) return;

      const currentIndex = focusedPath
        ? visibleItems.findIndex((item) => item.node.path === focusedPath)
        : -1;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const nextIndex =
            currentIndex < visibleItems.length - 1 ? currentIndex + 1 : 0;
          const nextItem = visibleItems[nextIndex];
          if (nextItem) {
            setFocusedPath(nextItem.node.path);
          }
          break;
        }

        case "ArrowUp": {
          e.preventDefault();
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : visibleItems.length - 1;
          const prevItem = visibleItems[prevIndex];
          if (prevItem) {
            setFocusedPath(prevItem.node.path);
          }
          break;
        }

        case "ArrowRight": {
          e.preventDefault();
          if (currentIndex >= 0) {
            const current = visibleItems[currentIndex];
            if (current && current.node.type === "directory") {
              if (!expandedPaths.has(current.node.path)) {
                handleExpandedChange(current.node.path, true);
              } else if (
                current.node.children &&
                current.node.children.length > 0
              ) {
                const firstChild = current.node.children[0];
                if (firstChild) {
                  setFocusedPath(firstChild.path);
                }
              }
            }
          }
          break;
        }

        case "ArrowLeft": {
          e.preventDefault();
          if (currentIndex >= 0) {
            const current = visibleItems[currentIndex];
            if (current) {
              if (
                current.node.type === "directory" &&
                expandedPaths.has(current.node.path)
              ) {
                handleExpandedChange(current.node.path, false);
              } else {
                const parentPath = getParentPath(current.node.path);
                if (parentPath) {
                  setFocusedPath(parentPath);
                }
              }
            }
          }
          break;
        }

        case "Home": {
          e.preventDefault();
          const firstItem = visibleItems[0];
          if (firstItem) {
            setFocusedPath(firstItem.node.path);
          }
          break;
        }

        case "End": {
          e.preventDefault();
          const lastItem = visibleItems[visibleItems.length - 1];
          if (lastItem) {
            setFocusedPath(lastItem.node.path);
          }
          break;
        }

        case "Enter":
        case " ": {
          e.preventDefault();
          if (currentIndex >= 0) {
            const current = visibleItems[currentIndex];
            if (current) {
              if (current.node.type === "directory") {
                handleExpandedChange(
                  current.node.path,
                  !expandedPaths.has(current.node.path),
                );
              } else {
                onFileSelect?.(current.node.path);
              }
            }
          }
          break;
        }
      }
    },
    [
      visibleItems,
      focusedPath,
      expandedPaths,
      handleExpandedChange,
      onFileSelect,
    ],
  );

  useEffect(() => {
    if (focusedPath) {
      const button = document.querySelector(
        `[data-path="${CSS.escape(focusedPath)}"]`,
      ) as HTMLElement;
      if (button) {
        button.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [focusedPath]);

  if (files.length === 0) {
    return (
      <div className={`p-4 text-sm text-muted ${className}`}>No files</div>
    );
  }

  return (
    <OverlayScrollbarsComponent
      className={className}
      role="tree"
      aria-label="File explorer"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      options={{
        scrollbars: {
          theme: "os-theme-monochrome",
          autoHide: "leave",
          autoHideDelay: 400,
        },
      }}
    >
      {files.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
          highlightedFile={highlightedFile}
          defaultExpanded
          focusedPath={focusedPath}
          onExpandedChange={handleExpandedChange}
        />
      ))}
    </OverlayScrollbarsComponent>
  );
});
