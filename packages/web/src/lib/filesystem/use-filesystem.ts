"use client";

import "./types";
import { useState, useCallback, useRef } from "react";
import type { FileNode } from "@lmms-lab/writer-shared";

type FileSystemState = {
  isSupported: boolean;
  isOpen: boolean;
  rootHandle: FileSystemDirectoryHandle | null;
  files: FileNode[];
  error: string | null;
};

const IGNORED_PATTERNS = [
  /^\.git$/,
  /^\.DS_Store$/,
  /^node_modules$/,
  /^\.next$/,
  /^dist$/,
  /^build$/,
  /^__pycache__$/,
  /\.aux$/,
  /\.log$/,
  /\.synctex\.gz$/,
  /\.fls$/,
  /\.fdb_latexmk$/,
  /\.out$/,
  /\.toc$/,
  /\.bbl$/,
  /\.blg$/,
];

function shouldIgnore(name: string): boolean {
  return IGNORED_PATTERNS.some((pattern) => pattern.test(name));
}

async function readDirectory(
  handle: FileSystemDirectoryHandle,
  path: string = "",
): Promise<FileNode[]> {
  const entries: FileNode[] = [];

  for await (const entry of handle.values()) {
    if (shouldIgnore(entry.name)) continue;

    const entryPath = path ? `${path}/${entry.name}` : entry.name;

    if (entry.kind === "directory") {
      const dirHandle = await handle.getDirectoryHandle(entry.name);
      const children = await readDirectory(dirHandle, entryPath);
      entries.push({
        name: entry.name,
        path: entryPath,
        type: "directory",
        children,
      });
    } else {
      entries.push({
        name: entry.name,
        path: entryPath,
        type: "file",
      });
    }
  }

  return entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

async function getFileHandle(
  rootHandle: FileSystemDirectoryHandle,
  path: string,
): Promise<FileSystemFileHandle> {
  const parts = path.split("/");
  const fileName = parts.pop()!;

  let currentDir = rootHandle;
  for (const part of parts) {
    currentDir = await currentDir.getDirectoryHandle(part);
  }

  return currentDir.getFileHandle(fileName);
}

export function useFileSystem() {
  const [state, setState] = useState<FileSystemState>({
    isSupported:
      typeof window !== "undefined" && "showDirectoryPicker" in window,
    isOpen: false,
    rootHandle: null,
    files: [],
    error: null,
  });

  const handleMapRef = useRef<Map<string, FileSystemFileHandle>>(new Map());

  const openFolder = useCallback(async () => {
    if (!state.isSupported) {
      setState((s) => ({
        ...s,
        error: "File System Access API not supported in this browser",
      }));
      return false;
    }

    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      const files = await readDirectory(handle);

      handleMapRef.current.clear();

      setState({
        isSupported: true,
        isOpen: true,
        rootHandle: handle,
        files,
        error: null,
      });

      return true;
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return false;
      }
      setState((s) => ({ ...s, error: (err as Error).message }));
      return false;
    }
  }, [state.isSupported]);

  const closeFolder = useCallback(() => {
    handleMapRef.current.clear();
    setState({
      isSupported: state.isSupported,
      isOpen: false,
      rootHandle: null,
      files: [],
      error: null,
    });
  }, [state.isSupported]);

  const refreshFiles = useCallback(async () => {
    if (!state.rootHandle) return;

    try {
      const files = await readDirectory(state.rootHandle);
      setState((s) => ({ ...s, files }));
    } catch (err) {
      setState((s) => ({ ...s, error: (err as Error).message }));
    }
  }, [state.rootHandle]);

  const readFile = useCallback(
    async (path: string): Promise<string | null> => {
      if (!state.rootHandle) return null;

      try {
        let fileHandle = handleMapRef.current.get(path);
        if (!fileHandle) {
          fileHandle = await getFileHandle(state.rootHandle, path);
          handleMapRef.current.set(path, fileHandle);
        }

        const file = await fileHandle.getFile();
        return await file.text();
      } catch (err) {
        setState((s) => ({
          ...s,
          error: `Failed to read ${path}: ${(err as Error).message}`,
        }));
        return null;
      }
    },
    [state.rootHandle],
  );

  const writeFile = useCallback(
    async (path: string, content: string): Promise<boolean> => {
      if (!state.rootHandle) return false;

      try {
        let fileHandle = handleMapRef.current.get(path);
        if (!fileHandle) {
          fileHandle = await getFileHandle(state.rootHandle, path);
          handleMapRef.current.set(path, fileHandle);
        }

        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        return true;
      } catch (err) {
        setState((s) => ({
          ...s,
          error: `Failed to write ${path}: ${(err as Error).message}`,
        }));
        return false;
      }
    },
    [state.rootHandle],
  );

  const createFile = useCallback(
    async (path: string, content: string = ""): Promise<boolean> => {
      if (!state.rootHandle) return false;

      try {
        const parts = path.split("/");
        const fileName = parts.pop()!;

        let currentDir = state.rootHandle;
        for (const part of parts) {
          currentDir = await currentDir.getDirectoryHandle(part, {
            create: true,
          });
        }

        const fileHandle = await currentDir.getFileHandle(fileName, {
          create: true,
        });
        handleMapRef.current.set(path, fileHandle);

        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        await refreshFiles();
        return true;
      } catch (err) {
        setState((s) => ({
          ...s,
          error: `Failed to create ${path}: ${(err as Error).message}`,
        }));
        return false;
      }
    },
    [state.rootHandle, refreshFiles],
  );

  return {
    isSupported: state.isSupported,
    isOpen: state.isOpen,
    files: state.files,
    error: state.error,
    openFolder,
    closeFolder,
    refreshFiles,
    readFile,
    writeFile,
    createFile,
  };
}
