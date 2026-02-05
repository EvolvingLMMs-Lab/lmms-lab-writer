import type { FileNode } from "@lmms-lab/writer-shared";
import { pathSync } from "@/lib/path";

/**
 * Recursively find all .tex files in a file tree
 */
export function findTexFiles(files: FileNode[]): string[] {
  const texFiles: string[] = [];

  function traverse(nodes: FileNode[]) {
    for (const node of nodes) {
      if (node.type === "file" && node.name.endsWith(".tex")) {
        texFiles.push(node.path);
      } else if (node.type === "directory" && node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(files);
  return texFiles;
}

/**
 * Find the most likely main .tex file in a project
 * Priority:
 * 1. Files named main.tex, paper.tex, thesis.tex, document.tex
 * 2. Files containing \documentclass in root directory
 * 3. Any .tex file in root directory
 */
export function findMainTexFile(files: FileNode[]): string | null {
  const commonMainNames = ["main.tex", "paper.tex", "thesis.tex", "document.tex", "report.tex"];

  // First check for common main file names in root
  for (const node of files) {
    if (node.type === "file" && commonMainNames.includes(node.name.toLowerCase())) {
      return node.path;
    }
  }

  // Then look for any .tex file in root
  for (const node of files) {
    if (node.type === "file" && node.name.endsWith(".tex")) {
      return node.path;
    }
  }

  // Finally, search recursively
  const allTexFiles = findTexFiles(files);
  if (allTexFiles.length > 0) {
    // Prefer files with common names
    for (const file of allTexFiles) {
      const fileName = pathSync.basename(file).toLowerCase();
      if (commonMainNames.includes(fileName)) {
        return file;
      }
    }
    return allTexFiles[0] ?? null;
  }

  return null;
}

/**
 * Get the expected PDF path from a .tex file path
 */
export function getPdfPathFromTex(texPath: string): string {
  return texPath.replace(/\.tex$/, ".pdf");
}

/**
 * Extract file name from path
 */
export function getFileName(path: string): string {
  return pathSync.basename(path);
}

/**
 * Check if a file is a LaTeX file
 */
export function isTexFile(path: string): boolean {
  return path.toLowerCase().endsWith(".tex");
}

/**
 * Format compilation time
 */
export function formatCompilationTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}
