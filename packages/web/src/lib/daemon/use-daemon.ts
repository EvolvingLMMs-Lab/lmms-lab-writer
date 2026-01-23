"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FileNode, GitInfo } from "@lmms-lab/writer-shared";

interface GitFileChange {
  path: string;
  status: "modified" | "added" | "deleted" | "renamed" | "untracked";
  staged: boolean;
}

interface GitStatus {
  branch: string;
  remote?: string;
  ahead: number;
  behind: number;
  changes: GitFileChange[];
  isRepo: boolean;
}

interface ProjectInfo {
  path: string;
  mainFile: string | null;
}

interface DaemonState {
  connected: boolean;
  version: string | null;
  projectPath: string | null;
  projectInfo: ProjectInfo | null;
  files: FileNode[];
  gitInfo: GitInfo | null;
  gitStatus: GitStatus | null;
  isCompiling: boolean;
  compileOutput: string;
}

export function useDaemon(wsUrl = "ws://localhost:3001") {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<DaemonState>({
    connected: false,
    version: null,
    projectPath: null,
    projectInfo: null,
    files: [],
    gitInfo: null,
    gitStatus: null,
    isCompiling: false,
    compileOutput: "",
  });

  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Connection established, wait for 'connected' message
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "connected":
            setState((s) => ({ ...s, connected: true, version: msg.version }));
            break;

          case "files":
            setState((s) => ({ ...s, files: msg.data }));
            break;

          case "git-info":
            setState((s) => ({ ...s, gitInfo: msg.data }));
            break;

          case "git-status":
            setState((s) => ({ ...s, gitStatus: msg.data }));
            break;

          case "project-info":
            setState((s) => ({
              ...s,
              projectPath: msg.path,
              projectInfo: { path: msg.path, mainFile: msg.mainFile },
            }));
            break;

          case "output":
            setTerminalOutput((prev) => [...prev.slice(-1000), msg.data]);
            break;

          case "compile-start":
            setState((s) => ({ ...s, isCompiling: true, compileOutput: "" }));
            break;

          case "compile-output":
            setState((s) => ({
              ...s,
              compileOutput: s.compileOutput + msg.data,
            }));
            break;

          case "compile-result":
            setState((s) => ({ ...s, isCompiling: false }));
            break;

          case "error":
            console.error("Daemon error:", msg.message);
            break;
        }
      } catch {
        // Non-JSON message, ignore
      }
    };

    ws.onclose = () => {
      setState((s) => ({ ...s, connected: false }));
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      setState((s) => ({ ...s, connected: false }));
    };
  }, [wsUrl]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const setProject = useCallback((path: string) => {
    wsRef.current?.send(JSON.stringify({ type: "set-project", path }));
  }, []);

  const sendInput = useCallback((data: string) => {
    wsRef.current?.send(JSON.stringify({ type: "input", data }));
  }, []);

  const resize = useCallback((cols: number, rows: number) => {
    wsRef.current?.send(JSON.stringify({ type: "resize", cols, rows }));
  }, []);

  const refreshFiles = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "refresh-files" }));
  }, []);

  const readFile = useCallback((path: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "file-content" && msg.path === path) {
            wsRef.current?.removeEventListener("message", handler);
            resolve(msg.content);
          }
        } catch {
          // Ignore
        }
      };
      wsRef.current?.addEventListener("message", handler);
      wsRef.current?.send(JSON.stringify({ type: "read-file", path }));

      // Timeout after 5 seconds
      setTimeout(() => {
        wsRef.current?.removeEventListener("message", handler);
        resolve(null);
      }, 5000);
    });
  }, []);

  const writeFile = useCallback((path: string, content: string) => {
    wsRef.current?.send(JSON.stringify({ type: "write-file", path, content }));
  }, []);

  const compile = useCallback((file?: string, engine?: string) => {
    wsRef.current?.send(JSON.stringify({ type: "compile", file, engine }));
  }, []);

  // Git operations
  const gitAdd = useCallback((files: string[]) => {
    wsRef.current?.send(JSON.stringify({ type: "git-add", files }));
  }, []);

  const gitCommit = useCallback((message: string) => {
    wsRef.current?.send(JSON.stringify({ type: "git-commit", message }));
  }, []);

  const gitPush = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "git-push" }));
  }, []);

  const gitPull = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "git-pull" }));
  }, []);

  const gitInit = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "git-init" }));
  }, []);

  const refreshGitStatus = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "git-status" }));
    wsRef.current?.send(JSON.stringify({ type: "get-git-info" }));
  }, []);

  return {
    ...state,
    terminalOutput,
    wsRef,
    setProject,
    sendInput,
    resize,
    refreshFiles,
    readFile,
    writeFile,
    compile,
    gitAdd,
    gitCommit,
    gitPush,
    gitPull,
    gitInit,
    refreshGitStatus,
  };
}
