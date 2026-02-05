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
   */
  dirname(path: string): string {
    const normalized = path.replace(/\\/g, "/");
    const lastSlash = normalized.lastIndexOf("/");
    if (lastSlash <= 0) return "";
    return normalized.substring(0, lastSlash);
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
   * Uses forward slashes; use normalize() for OS-specific format
   */
  join(...parts: string[]): string {
    return parts
      .map((p) => p.replace(/\\/g, "/"))
      .join("/")
      .replace(/\/+/g, "/");
  },

  /**
   * Normalize path separators to forward slashes (for comparison)
   */
  normalizeForCompare(path: string): string {
    return path.replace(/\\/g, "/").toLowerCase();
  },

  /**
   * Get all ancestor paths for a given path
   */
  ancestors(path: string): string[] {
    const normalized = path.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    const ancestors: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      ancestors.push(parts.slice(0, i).join("/"));
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
