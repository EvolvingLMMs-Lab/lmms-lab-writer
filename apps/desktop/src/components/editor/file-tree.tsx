"use client";

import { useState, useCallback, memo } from "react";
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
  className?: string;
};

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
  defaultExpanded = false,
}: {
  node: FileNode;
  depth: number;
  onFileSelect?: (path: string) => void;
  selectedFile?: string;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded || depth === 0);
  const isSelected = selectedFile === node.path;
  const isDirectory = node.type === "directory";

  const handleClick = useCallback(() => {
    if (isDirectory) {
      setExpanded((prev) => !prev);
    } else {
      onFileSelect?.(node.path);
    }
  }, [isDirectory, node.path, onFileSelect]);

  return (
    <div>
      <motion.button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-2 py-1 text-left text-sm transition-colors ${
          isSelected ? "bg-black text-white" : "hover:bg-black/5"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        whileTap={{ scale: 0.98 }}
        transition={ITEM_SPRING}
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
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const FileTree = memo(function FileTree({
  files,
  onFileSelect,
  selectedFile,
  className = "",
}: Props) {
  if (files.length === 0) {
    return (
      <div className={`p-4 text-sm text-muted ${className}`}>No files</div>
    );
  }

  return (
    <OverlayScrollbarsComponent
      className={className}
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
          defaultExpanded
        />
      ))}
    </OverlayScrollbarsComponent>
  );
});
