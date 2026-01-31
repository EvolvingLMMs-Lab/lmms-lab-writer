"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Check, Loader2, Copy, ExternalLink, RefreshCw } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getSupabaseClient } from "@/lib/supabase";

interface LoginCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (accessToken?: string) => void;
}

type LoginState = "idle" | "waiting" | "loading" | "success" | "error";
type LoginMethod = "auto" | "manual";

interface AuthServerInfo {
  port: number;
  callback_url: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "https://writer.lmms-lab.com";

export function LoginCodeModal({ isOpen, onClose, onSuccess }: LoginCodeModalProps) {
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<LoginState>("idle");
  const [method, setMethod] = useState<LoginMethod>("auto");
  const [linkCopied, setLinkCopied] = useState(false);
  const [serverInfo, setServerInfo] = useState<AuthServerInfo | null>(null);
  const [loginUrl, setLoginUrl] = useState<string>(`${WEB_URL}/login?source=desktop`);
  const inputRef = useRef<HTMLInputElement>(null);
  const unlistenSuccessRef = useRef<(() => void) | null>(null);
  const unlistenErrorRef = useRef<(() => void) | null>(null);

  // Process tokens (shared between auto and manual methods)
  const processTokens = useCallback(async (accessToken: string, refreshToken: string) => {
    console.log("[LoginCode] Processing tokens...");
    setState("loading");

    try {
      const supabase = getSupabaseClient();
      console.log("[LoginCode] Calling setSession...");

      const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      console.log("[LoginCode] setSession returned:", {
        hasSession: !!setSessionData?.session,
        error: setSessionError?.message
      });

      if (setSessionError || !setSessionData?.session) {
        // Fallback: validate token directly
        console.log("[LoginCode] setSession failed, validating access token...");
        const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);

        if (userError || !userData?.user) {
          throw new Error("invalid_token");
        }

        console.log("[LoginCode] Access token valid, user:", userData.user.email);
        setState("success");

        setTimeout(() => {
          onClose();
          onSuccess?.(accessToken);
        }, 500);
        return;
      }

      // Verify session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("no session");
      }

      console.log("[LoginCode] Success!");
      setState("success");

      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 500);

    } catch (err) {
      console.error("[LoginCode] Error:", err);
      const message = err instanceof Error ? err.message : "unknown";

      if (message === "invalid_token") {
        setError("Invalid or expired tokens. Please try again.");
      } else if (message === "no session") {
        setError("Failed to establish session. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
      setState("error");
    }
  }, [onClose, onSuccess]);

  // Start local auth server and set up listeners
  const startAuthServer = useCallback(async () => {
    try {
      console.log("[LoginCode] Starting auth server...");
      const info = await invoke<AuthServerInfo>("auth_start_server");
      console.log("[LoginCode] Auth server started:", info);
      setServerInfo(info);

      // Build login URL with callback
      const url = new URL(`${WEB_URL}/login`);
      url.searchParams.set("source", "desktop");
      url.searchParams.set("desktop_redirect_uri", info.callback_url);
      setLoginUrl(url.toString());

      return info;
    } catch (err) {
      console.error("[LoginCode] Failed to start auth server:", err);
      // Fall back to manual method
      setMethod("manual");
      setLoginUrl(`${WEB_URL}/login?source=desktop`);
      return null;
    }
  }, []);

  // Stop auth server
  const stopAuthServer = useCallback(async () => {
    try {
      await invoke("auth_stop_server");
      console.log("[LoginCode] Auth server stopped");
    } catch (err) {
      console.error("[LoginCode] Failed to stop auth server:", err);
    }
    setServerInfo(null);
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!isOpen || method !== "auto") return;

    let mounted = true;

    const setupListeners = async () => {
      // Listen for success
      unlistenSuccessRef.current = await listen<AuthTokens>("auth-callback-success", (event) => {
        if (!mounted) return;
        console.log("[LoginCode] Received auth-callback-success");
        const { access_token, refresh_token } = event.payload;
        processTokens(access_token, refresh_token);
      });

      // Listen for error
      unlistenErrorRef.current = await listen<string>("auth-callback-error", (event) => {
        if (!mounted) return;
        console.log("[LoginCode] Received auth-callback-error:", event.payload);
        setError(event.payload);
        setState("error");
      });
    };

    setupListeners();

    return () => {
      mounted = false;
      unlistenSuccessRef.current?.();
      unlistenErrorRef.current?.();
    };
  }, [isOpen, method, processTokens]);

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoginCode("");
      setError(null);
      setState("idle");
      setLinkCopied(false);
      setMethod("auto");

      // Start auth server for auto method
      startAuthServer().then((info) => {
        if (info) {
          setState("waiting");
        }
      });
    } else {
      // Clean up when modal closes
      stopAuthServer();
    }
  }, [isOpen, startAuthServer, stopAuthServer]);

  // Focus input when switching to manual method
  useEffect(() => {
    if (method === "manual" && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [method, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && state !== "loading") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, state, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(loginUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleOpenLink = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(loginUrl);
    } catch (err) {
      console.error("Failed to open link:", err);
      handleCopyLink();
    }
  };

  const handleCodeLogin = async () => {
    if (!loginCode.trim() || state === "loading") return;

    setError(null);
    setState("loading");

    try {
      const decoded = atob(loginCode.trim());
      const tokens = JSON.parse(decoded);
      const { accessToken, refreshToken } = tokens;

      if (!accessToken || !refreshToken) {
        throw new Error("missing tokens");
      }

      await processTokens(accessToken, refreshToken);
    } catch (err) {
      console.error("[LoginCode] Decode error:", err);
      setError("Invalid login code format. Please copy the code again.");
      setState("error");
    }
  };

  const handleRetry = async () => {
    setError(null);
    setState("idle");

    if (method === "auto") {
      await stopAuthServer();
      const info = await startAuthServer();
      if (info) {
        setState("waiting");
      }
    }
  };

  if (!isOpen) return null;

  const isLoading = state === "loading";
  const isSuccess = state === "success";
  const isWaiting = state === "waiting";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="bg-background border border-border w-full max-w-md mx-4 p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Login</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Auto method - waiting for callback */}
          {method === "auto" && (
            <>
              {isWaiting && (
                <div className="text-center py-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-muted" />
                  <p className="text-sm font-medium">Waiting for login...</p>
                  <p className="text-xs text-muted mt-1">
                    Complete the login in your browser. This page will update automatically.
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                  <p className="text-sm font-medium">Logging in...</p>
                </div>
              )}

              {isSuccess && (
                <div className="text-center py-4">
                  <Check className="w-8 h-8 mx-auto mb-3 text-green-600" />
                  <p className="text-sm font-medium text-green-600">Login successful!</p>
                </div>
              )}
            </>
          )}

          {/* Login URL - always shown */}
          {!isSuccess && (
            <div className="bg-neutral-50 border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  {method === "auto" && serverInfo ? "Login URL (auto-callback)" : "Login URL"}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyLink}
                    className="p-1 text-muted hover:text-black hover:bg-neutral-200 transition-colors"
                    title="Copy link"
                  >
                    {linkCopied ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={handleOpenLink}
                    className="p-1 text-muted hover:text-black hover:bg-neutral-200 transition-colors"
                    title="Open in browser"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs font-mono text-muted break-all select-all">
                {loginUrl}
              </p>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              <span>{error}</span>
              <button
                onClick={handleRetry}
                className="p-1 hover:bg-red-100 transition-colors"
                title="Retry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Manual method toggle and input */}
          {method === "auto" && !isSuccess && !isLoading && (
            <button
              onClick={() => setMethod("manual")}
              className="w-full text-xs text-muted hover:text-black transition-colors py-2"
            >
              Having trouble? Enter login code manually →
            </button>
          )}

          {method === "manual" && !isSuccess && (
            <>
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted mb-3">
                  Paste the login code from the web page:
                </p>
                <input
                  ref={inputRef}
                  type="text"
                  value={loginCode}
                  onChange={(e) => {
                    setLoginCode(e.target.value);
                    if (state === "error") {
                      setState("idle");
                      setError(null);
                    }
                  }}
                  placeholder="Paste login code here..."
                  className="w-full px-3 py-2 text-sm font-mono border border-border focus:outline-none focus:border-black"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCodeLogin();
                    }
                  }}
                />
              </div>

              <button
                onClick={() => setMethod("auto")}
                className="w-full text-xs text-muted hover:text-black transition-colors"
              >
                ← Back to automatic login
              </button>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm border border-border hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            {method === "auto" && !isSuccess && (
              <button
                onClick={handleOpenLink}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-sm border border-black bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Browser
              </button>
            )}

            {method === "manual" && (
              <button
                onClick={handleCodeLogin}
                disabled={isLoading || isSuccess || !loginCode.trim()}
                className={`flex-1 px-4 py-2 text-sm border transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isSuccess
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-black bg-black text-white hover:bg-neutral-800 disabled:opacity-50"
                }`}
              >
                {isSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Success!
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
