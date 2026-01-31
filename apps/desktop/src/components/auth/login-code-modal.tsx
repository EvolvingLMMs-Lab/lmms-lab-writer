"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, Loader2, Copy, ExternalLink } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

interface LoginCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (accessToken?: string) => void;
  loginUrl?: string;
}

type LoginState = "idle" | "loading" | "success" | "error";

const DEFAULT_LOGIN_URL = "https://writer.lmms-lab.com/login?source=desktop";

export function LoginCodeModal({ isOpen, onClose, onSuccess, loginUrl = DEFAULT_LOGIN_URL }: LoginCodeModalProps) {
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<LoginState>("idle");
  const [linkCopied, setLinkCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoginCode("");
      setError(null);
      setState("idle");
      setLinkCopied(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
      // Fallback: copy to clipboard
      handleCopyLink();
    }
  };

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

  const handleCodeLogin = async () => {
    if (!loginCode.trim() || state === "loading") return;

    setError(null);
    setState("loading");

    console.log("[LoginCode] Step 1: Decoding login code...");

    // Step 1: Decode and validate
    let accessToken: string;
    let refreshToken: string;

    try {
      const decoded = atob(loginCode.trim());
      console.log("[LoginCode] Decoded base64, parsing JSON...");
      const tokens = JSON.parse(decoded);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;

      if (!accessToken || !refreshToken) {
        throw new Error("missing tokens");
      }
      console.log("[LoginCode] Tokens extracted successfully");
      console.log("[LoginCode] Access token length:", accessToken.length);
      console.log("[LoginCode] Refresh token length:", refreshToken.length);
    } catch (err) {
      console.error("[LoginCode] Decode error:", err);
      setError("Invalid login code format. Please copy the code again.");
      setState("error");
      return;
    }

    // Step 2: Set session
    try {
      console.log("[LoginCode] Step 2: Getting Supabase client...");
      const supabase = getSupabaseClient();
      console.log("[LoginCode] Supabase client obtained");

      // Set session with the tokens
      // Note: With noOpLock configured in the Supabase client, this should not hang
      console.log("[LoginCode] Calling setSession...");
      const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      console.log("[LoginCode] setSession returned:", {
        hasData: !!setSessionData,
        hasSession: !!setSessionData?.session,
        error: setSessionError?.message
      });

      if (setSessionError || !setSessionData?.session) {
        // setSession failed - validate token and use fallback
        console.log("[LoginCode] setSession failed, validating access token...");

        const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
        console.log("[LoginCode] getUser returned:", {
          hasUser: !!userData?.user,
          error: userError?.message
        });

        if (userError || !userData?.user) {
          throw new Error("invalid_token");
        }

        console.log("[LoginCode] Access token valid, user:", userData.user.email);
        console.log("[LoginCode] Will pass access token to onSuccess for fallback auth");

        // Success - access token is valid
        setState("success");

        setTimeout(() => {
          console.log("[LoginCode] Closing modal and calling onSuccess with token...");
          onClose();
          onSuccess?.(accessToken);
        }, 500);
        return;
      }

      // Step 3: Verify session
      console.log("[LoginCode] Step 3: Verifying session...");
      const { data: { session } } = await supabase.auth.getSession();

      console.log("[LoginCode] Verification:", {
        hasSession: !!session,
        userEmail: session?.user?.email
      });

      if (!session) {
        throw new Error("no session");
      }

      // Success!
      console.log("[LoginCode] Success! Setting success state...");
      setState("success");

      setTimeout(() => {
        console.log("[LoginCode] Closing modal and calling onSuccess...");
        onClose();
        onSuccess?.();
      }, 500);

    } catch (err) {
      console.error("[LoginCode] Error:", err);
      const message = err instanceof Error ? err.message : "unknown";

      if (message === "invalid_token") {
        setError("Invalid or expired login code. Please get a new code.");
      } else if (message === "expired" || message.includes("Refresh Token")) {
        setError("Login code expired. Please get a new code from the web page.");
      } else if (message === "no session") {
        setError("Failed to establish session. Please try again.");
      } else {
        setError("Login failed. Please try again with a new code.");
      }

      setState("error");
    }
  };

  if (!isOpen) return null;

  const isLoading = state === "loading";
  const isSuccess = state === "success";

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
          <h2 className="text-lg font-medium">Login with Code</h2>
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
          <p className="text-sm text-muted">
            Complete the login in your browser, then paste the login code here.
          </p>

          {/* Login URL - copyable fallback */}
          <div className="bg-neutral-50 border border-border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Login URL</span>
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
            disabled={isLoading || isSuccess}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCodeLogin();
              }
            }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm border border-border hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
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
          </div>
        </div>
      </div>
    </div>
  );
}
