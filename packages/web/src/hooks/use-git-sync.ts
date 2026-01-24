import { useCallback, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getRepo,
  getCommitHistory,
  createOrUpdateFile,
  getFileContent,
  GitHubCommitResponse,
  GitHubAPIError,
} from "@/lib/github/git-api";

export type GitConnection = {
  owner: string;
  repo: string;
  branch: string;
  path?: string; // Path within repo, defaults to document title.tex or main.tex
};

export type GitSyncStatus =
  | "disconnected"
  | "synced"
  | "pending"
  | "syncing"
  | "error";

export function useGitSync(documentId: string, content: string, title: string) {
  const [connection, setConnection] = useState<GitConnection | null>(null);
  const [status, setStatus] = useState<GitSyncStatus>("disconnected");
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [history, setHistory] = useState<GitHubCommitResponse[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentRef = useRef(content);
  contentRef.current = content;

  // Load connection from local storage
  useEffect(() => {
    const saved = localStorage.getItem(`alw-git-connection-${documentId}`);
    if (saved) {
      try {
        setConnection(JSON.parse(saved));
        setStatus("synced"); // Assume synced initially until checked
      } catch (e) {
        console.error("Failed to parse git connection", e);
      }
    }
  }, [documentId]);

  const getToken = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.provider_token;
  }, []);

  const connect = useCallback(
    async (owner: string, repo: string, branch: string) => {
      const newConnection = { owner, repo, branch };
      localStorage.setItem(
        `alw-git-connection-${documentId}`,
        JSON.stringify(newConnection),
      );
      setConnection(newConnection);
      setStatus("synced");

      // Initial fetch of history
      const token = await getToken();
      if (token) {
        try {
          // Verify access
          await getRepo(token, owner, repo);
          await fetchHistory(owner, repo, branch);
        } catch (e) {
          console.error("Failed to verify repo access", e);
          setError("Failed to verify repository access");
        }
      }
    },
    [documentId, getToken],
  );

  const disconnect = useCallback(() => {
    localStorage.removeItem(`alw-git-connection-${documentId}`);
    setConnection(null);
    setStatus("disconnected");
    setHistory([]);
  }, [documentId]);

  const fetchHistory = useCallback(
    async (owner: string, repo: string, branch: string) => {
      setIsHistoryLoading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error("No access token");

        // Default path is usually root or based on title
        // For now we list commits for the whole repo if no specific path is set,
        // or we could assume the file is named "{title}.tex"
        const filePath = `${title.replace(/\s+/g, "_")}.tex`;

        const { commits } = await getCommitHistory(
          token,
          owner,
          repo,
          undefined,
          {
            limit: 10,
            sha: branch,
          },
        );
        setHistory(commits);
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [getToken, title],
  );

  const sync = useCallback(async () => {
    if (!connection) return;

    setStatus("syncing");
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error(
          "GitHub access token not found. Please sign in with GitHub.",
        );
      }

      const filePath = connection.path || `${title.replace(/\s+/g, "_")}.tex`;

      // Get current file sha if it exists
      let sha: string | undefined;
      try {
        const { sha: currentSha } = await getFileContent(
          token,
          connection.owner,
          connection.repo,
          filePath,
          connection.branch,
        );
        sha = currentSha;
      } catch (e) {
        // File might not exist yet, which is fine
      }

      await createOrUpdateFile(
        token,
        connection.owner,
        connection.repo,
        filePath,
        contentRef.current,
        `Update ${filePath}`,
        sha,
        connection.branch,
      );

      setLastSyncAt(new Date());
      setStatus("synced");
      await fetchHistory(connection.owner, connection.repo, connection.branch);
    } catch (e: any) {
      console.error("Sync failed", e);
      setStatus("error");
      setError(e.message || "Sync failed");
    }
  }, [connection, getToken, title, fetchHistory]);

  // Auto-sync debounce
  useEffect(() => {
    if (!connection || status === "disconnected") return;

    setStatus("pending");

    const timer = setTimeout(() => {
      sync();
    }, 30000); // 30s debounce

    return () => clearTimeout(timer);
  }, [content, connection, sync]);

  // Initial history load
  useEffect(() => {
    if (connection) {
      fetchHistory(connection.owner, connection.repo, connection.branch);
    }
  }, [connection, fetchHistory]);

  return {
    connection,
    status,
    lastSyncAt,
    history,
    isHistoryLoading,
    error,
    connect,
    disconnect,
    sync,
    refreshHistory: () =>
      connection &&
      fetchHistory(connection.owner, connection.repo, connection.branch),
  };
}
