"use client";

import {
  useState,
  useCallback,
  memo,
  useRef,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import { Tree } from "react-arborist";
import type { NodeRendererProps, TreeApi } from "react-arborist";
import { motion } from "framer-motion";
import { ask } from "@tauri-apps/plugin-dialog";
import { Command } from "@tauri-apps/plugin-shell";
import { platform } from "@tauri-apps/plugin-os";
import { normalize } from "@tauri-apps/api/path";
import { pathSync } from "@/lib/path";

async function runCommand(cmd: string, args: string[]): Promise<boolean> {
  try {
    const result = await Command.create(cmd, args).execute();
    return result.code === 0;
  } catch {
    return false;
  }
}

// Reveal file/folder in system file manager
async function revealInFileManager(path: string): Promise<void> {
  const os = platform();
  const normalizedPath = await normalize(path);

  if (os === "macos") {
    // macOS: open -R reveals the item in Finder
    const ok = await runCommand("open", ["-R", normalizedPath]);
    if (!ok) {
      await runCommand("open", [normalizedPath]);
    }
  } else if (os === "windows") {
    // Windows: explorer /select, highlights the item
    const escaped = normalizedPath.replace(/"/g, '\\"');
    await runCommand("explorer", [`/select,"${escaped}"`]);
  } else {
    // Linux: xdg-open opens the containing folder
    const parentPath = pathSync.dirname(normalizedPath) || normalizedPath;
    const ok = await runCommand("xdg-open", [parentPath]);
    if (!ok) {
      await runCommand("gio", ["open", parentPath]);
    }
  }
}
import type { FileNode } from "@lmms-lab/writer-shared";
import { ContextMenu, type ContextMenuItem } from "../ui/context-menu";
import { InputDialog } from "../ui/input-dialog";
import {
  File,
  FileText,
  FileCode,
  FileJson,
  FileImage,
  FileArchive,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileCog,
  FilePen,
  FileOutput,
  FileBox,
  FileTerminal,
  Folder,
  FolderOpen,
  Library,
  LayoutTemplate,
  Blocks,
  type LucideIcon,
} from "lucide-react";

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
  projectPath?: string;
  onRefresh?: () => void;
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

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot > 0 ? filename.substring(lastDot).toLowerCase() : "";
}

// Map file extensions to icons
const FILE_ICON_MAP: Record<string, LucideIcon> = {
  // LaTeX source files
  ".tex": FilePen,
  ".ltx": FilePen,
  // LaTeX bibliography
  ".bib": Library,
  // LaTeX document class (template)
  ".cls": LayoutTemplate,
  // LaTeX style packages
  ".sty": Blocks,
  // LaTeX package source
  ".dtx": FileBox,
  ".ins": FileBox,
  // LaTeX output
  ".pdf": FileOutput,
  ".dvi": FileOutput,
  ".ps": FileOutput,
  // LaTeX config
  ".latexmkrc": FileCog,
  // Documents
  ".doc": FileText,
  ".docx": FileText,
  ".txt": FileText,
  ".rtf": FileText,
  ".md": FileText,
  ".mdx": FileText,
  ".rst": FileText,
  // Code
  ".js": FileCode,
  ".jsx": FileCode,
  ".ts": FileCode,
  ".tsx": FileCode,
  ".mjs": FileCode,
  ".cjs": FileCode,
  ".py": FileCode,
  ".rb": FileCode,
  ".go": FileCode,
  ".rs": FileCode,
  ".c": FileCode,
  ".cpp": FileCode,
  ".h": FileCode,
  ".hpp": FileCode,
  ".java": FileCode,
  ".kt": FileCode,
  ".swift": FileCode,
  ".lua": FileCode,
  ".r": FileCode,
  ".m": FileCode,
  ".html": FileCode,
  ".htm": FileCode,
  ".css": FileCode,
  ".scss": FileCode,
  ".sass": FileCode,
  ".less": FileCode,
  ".vue": FileCode,
  ".svelte": FileCode,
  // Shell/Scripts
  ".sh": FileTerminal,
  ".bash": FileTerminal,
  ".zsh": FileTerminal,
  ".fish": FileTerminal,
  ".ps1": FileTerminal,
  ".bat": FileTerminal,
  ".cmd": FileTerminal,
  // Config/Data
  ".json": FileJson,
  ".yaml": FileJson,
  ".yml": FileJson,
  ".toml": FileJson,
  ".xml": FileJson,
  ".ini": FileCog,
  ".cfg": FileCog,
  ".conf": FileCog,
  ".env": FileCog,
  ".gitignore": FileCog,
  ".editorconfig": FileCog,
  ".prettierrc": FileCog,
  ".eslintrc": FileCog,
  // Images
  ".png": FileImage,
  ".jpg": FileImage,
  ".jpeg": FileImage,
  ".gif": FileImage,
  ".svg": FileImage,
  ".webp": FileImage,
  ".ico": FileImage,
  ".bmp": FileImage,
  ".tiff": FileImage,
  ".tif": FileImage,
  ".eps": FileImage,
  ".pgf": FileImage,
  ".tikz": FileImage,
  // Archives
  ".zip": FileArchive,
  ".tar": FileArchive,
  ".gz": FileArchive,
  ".rar": FileArchive,
  ".7z": FileArchive,
  // Video
  ".mp4": FileVideo,
  ".mkv": FileVideo,
  ".avi": FileVideo,
  ".mov": FileVideo,
  ".webm": FileVideo,
  // Audio
  ".mp3": FileAudio,
  ".wav": FileAudio,
  ".flac": FileAudio,
  ".ogg": FileAudio,
  ".m4a": FileAudio,
  // Spreadsheet/Data
  ".csv": FileSpreadsheet,
  ".xls": FileSpreadsheet,
  ".xlsx": FileSpreadsheet,
  ".tsv": FileSpreadsheet,
};

function FileIcon({
  type,
  expanded,
  filename,
}: {
  type: "file" | "directory";
  expanded?: boolean;
  filename?: string;
}) {
  const iconClass = "w-4 h-4 flex-shrink-0";

  if (type === "directory") {
    return expanded ? (
      <FolderOpen className={iconClass} />
    ) : (
      <Folder className={iconClass} />
    );
  }

  const ext = filename ? getFileExtension(filename) : "";
  const IconComponent = FILE_ICON_MAP[ext] || File;

  return <IconComponent className={iconClass} />;
}

// --- react-arborist data types ---

interface ArboristFileNode {
  id: string;
  name: string;
  type: "file" | "directory";
  path: string;
  children?: ArboristFileNode[];
}

function convertToArboristData(nodes: FileNode[]): ArboristFileNode[] {
  return nodes.map((node) => {
    const result: ArboristFileNode = {
      id: node.path,
      name: node.name,
      type: node.type,
      path: node.path,
    };
    if (node.type === "directory") {
      result.children = node.children
        ? convertToArboristData(node.children)
        : [];
    }
    return result;
  });
}

// --- Context for passing data to node renderer ---

interface FileTreeContextValue {
  selectedFile?: string;
  highlightedFile?: string | null;
  onContextMenu?: (
    e: React.MouseEvent,
    node: FileNode,
    parentPath: string,
  ) => void;
  onFileSelect?: (path: string) => void;
}

const FileTreeContext = createContext<FileTreeContextValue>({});

// --- Node renderer ---

function NodeRenderer({
  node,
  style,
}: NodeRendererProps<ArboristFileNode>) {
  const { selectedFile, highlightedFile, onContextMenu, onFileSelect } =
    useContext(FileTreeContext);

  const isDirectory = node.data.type === "directory";
  const isSelected = selectedFile === node.data.path;
  const isHighlighted = highlightedFile === node.data.path;
  const isFocused = node.isFocused && !isSelected;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDirectory) {
        node.toggle();
      } else {
        onFileSelect?.(node.data.path);
      }
      node.focus();
    },
    [isDirectory, node, onFileSelect],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Find parent path from the node's path
      const parentPath = pathSync.dirname(node.data.path);
      onContextMenu?.(
        e,
        {
          name: node.data.name,
          path: node.data.path,
          type: node.data.type,
        },
        parentPath,
      );
    },
    [onContextMenu, node.data],
  );

  return (
    <div style={style}>
      <motion.button
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        role="treeitem"
        aria-expanded={isDirectory ? node.isOpen : undefined}
        aria-selected={isSelected}
        tabIndex={-1}
        data-path={node.data.path}
        className={`w-full flex items-center gap-2 px-2 py-1 text-left text-sm transition-colors ${
          isSelected
            ? "bg-black text-white"
            : isFocused
              ? "bg-black/10"
              : "hover:bg-black/5"
        }`}
        style={{ paddingLeft: `${node.level * 12 + 8}px`, height: "28px" }}
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
            animate={{ rotate: node.isOpen ? 90 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </motion.div>
        )}
        {!isDirectory && <span className="w-3" />}
        <FileIcon
          type={node.data.type}
          expanded={node.isOpen}
          filename={node.data.name}
        />
        <span className="truncate">{node.data.name}</span>
      </motion.button>
    </div>
  );
}

// --- Helpers ---

function getParentPath(path: string): string | null {
  const parent = pathSync.dirname(path);
  return parent || null;
}

function collectAllAncestorPaths(path: string): string[] {
  return pathSync.ancestors(path);
}

// Build a flat lookup from path -> FileNode for keyboard shortcuts
function buildNodeMap(nodes: FileNode[]): Map<string, FileNode> {
  const map = new Map<string, FileNode>();
  function walk(list: FileNode[]) {
    for (const n of list) {
      map.set(n.path, n);
      if (n.children) walk(n.children);
    }
  }
  walk(nodes);
  return map;
}

// --- Main component ---

export const FileTree = memo(function FileTree({
  files,
  onFileSelect,
  selectedFile,
  highlightedFile,
  className = "",
  fileOperations,
  projectPath,
  onRefresh,
}: Props) {
  const treeRef = useRef<TreeApi<ArboristFileNode>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const arboristData = useMemo(() => convertToArboristData(files), [files]);
  const nodeMap = useMemo(() => buildNodeMap(files), [files]);

  // Measure container for react-arborist width/height
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Highlight effect: open ancestors and scroll into view
  useEffect(() => {
    const tree = treeRef.current;
    if (!tree || !highlightedFile) return;

    // Open all ancestor directories
    const ancestors = collectAllAncestorPaths(highlightedFile);
    for (const ancestorPath of ancestors) {
      tree.open(ancestorPath);
    }

    // Scroll to the highlighted node after a short delay to let opens settle
    requestAnimationFrame(() => {
      tree.scrollTo(highlightedFile, "center");
    });
  }, [highlightedFile]);

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

  // Handle right-click on empty area
  const handleRootContextMenu = useCallback(
    (e: React.MouseEvent) => {
      // Only show if clicking on the container itself, not on a tree node
      if ((e.target as HTMLElement).closest("[data-path]")) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        node: { name: "", path: "", type: "directory" } as FileNode,
        parentPath: "",
      });
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tree = treeRef.current;
      if (!tree) return;

      const focusedNode = tree.focusedNode;
      const currentNode = focusedNode
        ? nodeMap.get(focusedNode.data.path) ?? null
        : null;

      switch (e.key) {
        // F2 - Rename
        case "F2": {
          e.preventDefault();
          if (currentNode && fileOperations) {
            setDialog({ type: "rename", node: currentNode });
          }
          break;
        }

        // Delete or Backspace - Delete file/folder
        case "Delete":
        case "Backspace": {
          e.preventDefault();
          if (currentNode && fileOperations) {
            const isDirectory = currentNode.type === "directory";
            const nodePath = currentNode.path;
            const nodeName = currentNode.name;
            (async () => {
              const confirmed = await ask(
                `Are you sure you want to delete "${nodeName}"?${isDirectory ? " This will delete all files inside." : ""}`,
                { title: "Confirm Delete", kind: "warning" },
              );
              if (confirmed) {
                try {
                  await fileOperations.deletePath(nodePath);
                } catch (error) {
                  alert(`Failed to delete: ${error}`);
                }
              }
            })();
          }
          break;
        }

        // N - New file (Shift+N for new folder)
        case "n":
        case "N": {
          if (!fileOperations) break;
          e.preventDefault();
          const parentPath = currentNode
            ? currentNode.type === "directory"
              ? currentNode.path
              : getParentPath(currentNode.path) || ""
            : "";

          if (e.shiftKey) {
            setDialog({ type: "create-directory", parentPath });
          } else {
            setDialog({ type: "create-file", parentPath });
          }
          break;
        }

        // F5 - Refresh file list
        case "F5": {
          e.preventDefault();
          onRefresh?.();
          break;
        }

        // R - Reveal in Explorer/Finder
        case "r":
        case "R": {
          if (!currentNode || !projectPath) break;
          e.preventDefault();
          const fullPath = `${projectPath}/${currentNode.path}`;
          revealInFileManager(fullPath).catch(console.error);
          break;
        }
      }
    },
    [nodeMap, fileOperations, onRefresh, projectPath],
  );

  const getContextMenuItems = useCallback(
    (node: FileNode, _parentPath: string): ContextMenuItem[] => {
      const isDirectory = node.type === "directory";
      const items: ContextMenuItem[] = [];

      if (isDirectory) {
        items.push({
          label: "New File",
          onClick: () =>
            setDialog({ type: "create-file", parentPath: node.path }),
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
          const confirmed = await ask(
            `Are you sure you want to delete "${node.name}"?${isDirectory ? " This will delete all files inside." : ""}`,
            { title: "Confirm Delete", kind: "warning" },
          );
          if (confirmed) {
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

      if (projectPath) {
        const os = platform();
        const revealLabel =
          os === "macos"
            ? "Reveal in Finder"
            : os === "windows"
              ? "Reveal in Explorer"
              : "Reveal in File Manager";
        items.push({
          label: revealLabel,
          onClick: async () => {
            const fullPath = `${projectPath}/${node.path}`;
            try {
              await revealInFileManager(fullPath);
            } catch (error) {
              console.error("Failed to reveal in file manager:", error);
            }
          },
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          ),
        });
      }

      if (onRefresh) {
        items.push({
          label: "Refresh",
          onClick: onRefresh,
          icon: (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ),
        });
      }

      return items;
    },
    [fileOperations, projectPath, onRefresh],
  );

  // Context menu items for empty area (root level)
  const getRootContextMenuItems = useCallback((): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];

    if (fileOperations) {
      items.push({
        label: "New File",
        onClick: () => setDialog({ type: "create-file", parentPath: "" }),
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
        onClick: () => setDialog({ type: "create-directory", parentPath: "" }),
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

    if (projectPath) {
      const os = platform();
      const revealLabel =
        os === "macos"
          ? "Reveal in Finder"
          : os === "windows"
            ? "Reveal in Explorer"
            : "Reveal in File Manager";
      items.push({
        label: revealLabel,
        onClick: async () => {
          try {
            await revealInFileManager(projectPath);
          } catch (error) {
            console.error("Failed to reveal in file manager:", error);
          }
        },
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        ),
      });
    }

    if (onRefresh) {
      items.push({
        label: "Refresh",
        onClick: onRefresh,
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ),
      });
    }

    return items;
  }, [fileOperations, projectPath, onRefresh]);

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

  const ctxValue = useMemo<FileTreeContextValue>(
    () => ({
      selectedFile,
      highlightedFile,
      onContextMenu: handleContextMenu,
      onFileSelect,
    }),
    [selectedFile, highlightedFile, handleContextMenu, onFileSelect],
  );

  if (files.length === 0) {
    return (
      <div className={`p-4 text-sm text-muted ${className}`}>No files</div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        role="tree"
        aria-label="File explorer"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onContextMenu={handleRootContextMenu}
      >
        <FileTreeContext.Provider value={ctxValue}>
          {containerSize.width > 0 && containerSize.height > 0 && (
            <Tree<ArboristFileNode>
              ref={treeRef}
              data={arboristData}
              width={containerSize.width}
              height={containerSize.height}
              rowHeight={28}
              indent={12}
              openByDefault={true}
              disableDrag={true}
              disableDrop={true}
              disableEdit={true}
              disableMultiSelection={true}
            >
              {NodeRenderer}
            </Tree>
          )}
        </FileTreeContext.Provider>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={
            contextMenu.node.path === ""
              ? getRootContextMenuItems()
              : getContextMenuItems(contextMenu.node, contextMenu.parentPath)
          }
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
