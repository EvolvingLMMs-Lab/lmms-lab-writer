"use client";

import { FileTree, type FileOperations } from "@/components/editor/file-tree";
import { EditorErrorBoundary } from "@/components/editor/editor-error-boundary";
import { pathSync } from "@/lib/path";
import type { FileNode } from "@lmms-lab/writer-shared";
import {
  ArrowClockwiseIcon,
  FilePlusIcon,
  FolderIcon,
  FolderPlusIcon,
} from "@phosphor-icons/react";

type FileSidebarPanelProps = {
  projectPath: string | null;
  files: FileNode[];
  selectedFile?: string;
  highlightedFile: string | null;
  onFileSelect: (path: string) => void;
  onCreateFile: () => void;
  onCreateDirectory: () => void;
  onRefreshFiles: () => void | Promise<void>;
  fileOperations: FileOperations;
};

export function FileSidebarPanel({
  projectPath,
  files,
  selectedFile,
  highlightedFile,
  onFileSelect,
  onCreateFile,
  onCreateDirectory,
  onRefreshFiles,
  fileOperations,
}: FileSidebarPanelProps) {
  if (!projectPath) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-muted">
        <FolderIcon className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-xs">No folder open</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="px-3 py-2 border-b border-border flex items-center justify-between gap-2"
        title={projectPath}
      >
        <span className="text-xs text-muted truncate">
          {pathSync.basename(projectPath)}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onCreateFile}
            className="p-1 text-muted hover:text-black hover:bg-black/5 transition-colors"
            title="New File"
            aria-label="New File"
          >
            <FilePlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onCreateDirectory}
            className="p-1 text-muted hover:text-black hover:bg-black/5 transition-colors"
            title="New Folder"
            aria-label="New Folder"
          >
            <FolderPlusIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onRefreshFiles}
            className="p-1 text-muted hover:text-black hover:bg-black/5 transition-colors"
            title="Refresh Files"
            aria-label="Refresh Files"
          >
            <ArrowClockwiseIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <EditorErrorBoundary>
        <FileTree
          files={files}
          selectedFile={selectedFile}
          highlightedFile={highlightedFile}
          onFileSelect={onFileSelect}
          className="flex-1 min-h-0 overflow-hidden"
          fileOperations={fileOperations}
          projectPath={projectPath}
          onRefresh={onRefreshFiles}
        />
      </EditorErrorBoundary>
    </>
  );
}
