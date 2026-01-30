"use client";

import { useState, useEffect, useRef } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

interface LoginCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type LoginState = "idle" | "loading" | "success" | "error";

export function LoginCodeModal({ isOpen, onClose, onSuccess }: LoginCodeModalProps) {
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<LoginState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoginCode("");
      setError(null);
      setState("idle");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

    // Step 1: Decode and validate
    let accessToken: string;
    let refreshToken: string;

    try {
      const decoded = atob(loginCode.trim());
      const tokens = JSON.parse(decoded);
      accessToken = tokens.accessToken;
      refreshToken = tokens.refreshToken;

      if (!accessToken || !refreshToken) {
        throw new Error("missing tokens");
      }
    } catch {
      setError("Invalid login code format. Please copy the code again.");
      setState("error");
      return;
    }

    // Step 2: Set session
    try {
      const supabase = getSupabaseClient();

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (setSessionError) {
        // Try refresh as fallback
        const { error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (refreshError) {
          throw new Error("expired");
        }
      }

      // Step 3: Verify session is actually set
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("no session");
      }

      // Success!
      setState("success");

      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 500);

    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";

      if (message === "expired" || message.includes("Refresh Token")) {
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
