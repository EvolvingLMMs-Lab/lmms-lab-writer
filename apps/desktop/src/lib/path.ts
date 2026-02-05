"use client";

import {
  basename as tauriBasename,
  dirname as tauriDirname,
  join as tauriJoin,
  normalize as tauriNormalize,
  extname as tauriExtname,
  sep as tauriSep,
} from "@tauri-apps/api/path";

// Re-export async Tauri path functions
export const basename = tauriBasename;
export const dirname = tauriDirname;
export const join = tauriJoin;
export const normalize = tauriNormalize;
export const extname = tauriExtname;
export const sep = tauriSep;

/**
 * Detect the path separator used in a path string
 */
function detectSeparator(path: string): string {
  // If path contains backslash, it's likely Windows
  if (path.includes("\\")) return "\\";
  return "/";
}

/**
 * Synchronous path utilities for use in render functions where async is not possible.
 * These work correctly on both Windows and Unix by handling both separators.
 */
export const pathSync = {
  /**
   * Get the file/folder name from a path (synchronous)
   */
  basename(path: string): string {
    // Handle both Windows and Unix separators
    const normalized = path.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    return parts[parts.length - 1] || path;
  },

  /**
   * Get the parent directory path (synchronous)
   * Preserves the original path separator style
   */
  dirname(path: string): string {
    const sep = detectSeparator(path);
    const normalized = path.replace(/\\/g, "/");
    const lastSlash = normalized.lastIndexOf("/");
    if (lastSlash <= 0) return "";
    const result = normalized.substring(0, lastSlash);
    // Restore original separator if needed
    return sep === "\\" ? result.replace(/\//g, "\\") : result;
  },

  /**
   * Get file extension including the dot (synchronous)
   */
  extname(path: string): string {
    const name = pathSync.basename(path);
    const lastDot = name.lastIndexOf(".");
    return lastDot > 0 ? name.substring(lastDot).toLowerCase() : "";
  },

  /**
   * Join path segments (synchronous)
   * Preserves the separator style of the first path segment
   */
  join(...parts: string[]): string {
    if (parts.length === 0) return "";
    const firstPart = parts[0] || "";
    const sep = detectSeparator(firstPart);

    // Normalize all parts to forward slashes for joining
    const joined = parts
      .map((p) => p.replace(/\\/g, "/"))
      .join("/")
      .replace(/\/+/g, "/");

    // Convert back to original separator if needed
    return sep === "\\" ? joined.replace(/\//g, "\\") : joined;
  },

  /**
   * Normalize path separators to forward slashes (for comparison)
   */
  normalizeForCompare(path: string): string {
    return path.replace(/\\/g, "/").toLowerCase();
  },

  /**
   * Get all ancestor paths for a given path
   * Preserves the original path separator style
   */
  ancestors(path: string): string[] {
    const sep = detectSeparator(path);
    const normalized = path.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    const ancestors: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      const ancestorPath = parts.slice(0, i).join("/");
      ancestors.push(sep === "\\" ? ancestorPath.replace(/\//g, "\\") : ancestorPath);
    }
    return ancestors;
  },

  /**
   * Check if path has a parent (not root level)
   */
  hasParent(path: string): boolean {
    const normalized = path.replace(/\\/g, "/");
    return normalized.includes("/") && normalized.lastIndexOf("/") > 0;
  },
};
