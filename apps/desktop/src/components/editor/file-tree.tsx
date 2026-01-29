"use client";

import { useState, useCallback, memo, useRef, useEffect, useMemo } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FileNode } from "@lmms-lab/writer-shared";
import { ContextMenu, type ContextMenuItem } from "../ui/context-menu";
import { InputDialog } from "../ui/input-dialog";

const _ITEM_SPRING = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.5,
} as const;

export interface FileOperations {
  createFile: (path: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
  renamePath: (oldPath: string, newPath: string) => Promise<void>;
  deletePath: (path: string) => Promise<void>;
}

type Props = {
  files: FileNode[];
  onFileSelect?: (path: string) => void;
  selectedFile?: string;
  highlightedFile?: string | null;
  className?: string;
  fileOperations?: FileOperations;
};

interface ContextMenuState {
  x: number;
  y: number;
  node: FileNode;
  parentPath: string;
}

interface DialogState {
  type: "create-file" | "create-directory" | "rename";
  parentPath?: string;
  node?: FileNode;
}

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
  onContextMenu,
  parentPath = "",
}: {
  node: FileNode;
  depth: number;
  onFileSelect?: (path: string) => void;
  selectedFile?: string;
  highlightedFile?: string | null;
  defaultExpanded?: boolean;
  focusedPath?: string | null;
  onExpandedChange?: (path: string, expanded: boolean) => void;
  onContextMenu?: (
    e: React.MouseEvent,
    node: FileNode,
    parentPath: string,
  ) => void;
  parentPath?: string;
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

  // Auto-expand when shouldAutoExpand becomes true
  useEffect(() => {
    if (shouldAutoExpand && !expanded) {
      setExpanded(true);
      onExpandedChange?.(node.path, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to shouldAutoExpand changes
  }, [shouldAutoExpand]);

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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu?.(e, node, parentPath);
    },
    [onContextMenu, node, parentPath],
  );

  return (
    <div>
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
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
                onContextMenu={onContextMenu}
                parentPath={node.path}
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
  fileOperations,
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

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(
    null,
  );
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: FileNode, parentPath: string) => {
      if (!fileOperations) return;

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        node,
        parentPath,
      });
    },
    [fileOperations],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const getContextMenuItems = useCallback(
    (node: FileNode, _parentPath: string): ContextMenuItem[] => {
      const isDirectory = node.type === "directory";
      const items: ContextMenuItem[] = [];

      if (isDirectory) {
        items.push({
          label: "New File",
          onClick: () => setDialog({ type: "create-file", parentPath: node.path }),
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ),
        });
        items.push({
          label: "New Folder",
          onClick: () =>
            setDialog({ type: "create-directory", parentPath: node.path }),
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
          ),
        });
      }

      items.push({
        label: "Rename",
        onClick: () => setDialog({ type: "rename", node }),
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        ),
      });

      items.push({
        label: "Delete",
        onClick: async () => {
          if (
            confirm(
              `Are you sure you want to delete "${node.name}"?${isDirectory ? " This will delete all files inside." : ""}`,
            )
          ) {
            try {
              await fileOperations?.deletePath(node.path);
            } catch (error) {
              alert(`Failed to delete: ${error}`);
            }
          }
        },
        danger: true,
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        ),
      });

      return items;
    },
    [fileOperations],
  );

  const validateFileName = useCallback((name: string): string | null => {
    if (!name.trim()) {
      return "Name cannot be empty";
    }
    if (name.includes("/") || name.includes("\\")) {
      return "Name cannot contain / or \\";
    }
    if (name.startsWith(".")) {
      return "Name cannot start with .";
    }
    return null;
  }, []);

  const handleDialogConfirm = useCallback(
    async (value: string) => {
      if (!dialog || !fileOperations) return;

      try {
        if (dialog.type === "create-file") {
          const newPath = dialog.parentPath
            ? `${dialog.parentPath}/${value}`
            : value;
          await fileOperations.createFile(newPath);
        } else if (dialog.type === "create-directory") {
          const newPath = dialog.parentPath
            ? `${dialog.parentPath}/${value}`
            : value;
          await fileOperations.createDirectory(newPath);
        } else if (dialog.type === "rename" && dialog.node) {
          const parentPath = dialog.node.path.includes("/")
            ? dialog.node.path.substring(0, dialog.node.path.lastIndexOf("/"))
            : "";
          const newPath = parentPath ? `${parentPath}/${value}` : value;
          await fileOperations.renamePath(dialog.node.path, newPath);
        }
        closeDialog();
      } catch (error) {
        alert(`Operation failed: ${error}`);
      }
    },
    [dialog, fileOperations, closeDialog],
  );

  if (files.length === 0) {
    return (
      <div className={`p-4 text-sm text-muted ${className}`}>No files</div>
    );
  }

  return (
    <>
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
            onContextMenu={handleContextMenu}
            defaultExpanded
            focusedPath={focusedPath}
            onExpandedChange={handleExpandedChange}
          />
        ))}
      </OverlayScrollbarsComponent>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.node, contextMenu.parentPath)}
          onClose={closeContextMenu}
        />
      )}

      {dialog && (
        <InputDialog
          title={
            dialog.type === "create-file"
              ? "New File"
              : dialog.type === "create-directory"
                ? "New Folder"
                : "Rename"
          }
          placeholder={
            dialog.type === "rename"
              ? dialog.node?.name
              : dialog.type === "create-file"
                ? "file.tex"
                : "folder"
          }
          defaultValue={dialog.type === "rename" ? dialog.node?.name : ""}
          onConfirm={handleDialogConfirm}
          onCancel={closeDialog}
          validator={validateFileName}
        />
      )}
    </>
  );
});
