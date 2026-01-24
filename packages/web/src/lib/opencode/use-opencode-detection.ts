"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type OpenCodeServerStatus = {
  available: boolean;
  checking: boolean;
  lastChecked: number | null;
  error: string | null;
};

export type UseOpenCodeDetectionOptions = {
  baseUrl?: string;
  pollInterval?: number;
  enabled?: boolean;
};

const DEFAULT_BASE_URL = "http://localhost:4096";
const DEFAULT_POLL_INTERVAL = 5000;

export function useOpenCodeDetection(
  options: UseOpenCodeDetectionOptions = {},
) {
  const {
    baseUrl = DEFAULT_BASE_URL,
    pollInterval = DEFAULT_POLL_INTERVAL,
    enabled = true,
  } = options;

  const [status, setStatus] = useState<OpenCodeServerStatus>({
    available: false,
    checking: false,
    lastChecked: null,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkServer = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setStatus((prev) => ({ ...prev, checking: true, error: null }));

    try {
      const response = await fetch(`${baseUrl}/session`, {
        method: "GET",
        signal: abortControllerRef.current.signal,
        headers: {
          Accept: "application/json",
        },
      });

      const available = response.ok;
      setStatus({
        available,
        checking: false,
        lastChecked: Date.now(),
        error: available ? null : `Server returned ${response.status}`,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        return;
      }

      setStatus({
        available: false,
        checking: false,
        lastChecked: Date.now(),
        error: "OpenCode server not reachable",
      });
    }
  }, [baseUrl]);

  useEffect(() => {
    if (!enabled) {
      setStatus({
        available: false,
        checking: false,
        lastChecked: null,
        error: null,
      });
      return;
    }

    checkServer();

    intervalRef.current = setInterval(checkServer, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [enabled, checkServer, pollInterval]);

  const refresh = useCallback(() => {
    checkServer();
  }, [checkServer]);

  return {
    ...status,
    refresh,
  };
}
