"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

interface LoginCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginCodeModal({ isOpen, onClose }: LoginCodeModalProps) {
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoginCode("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, loading, onClose]);

  const handleCodeLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      // Decode the login code (base64 encoded JSON)
      console.log("[login-code-modal] Decoding login code...");
      let decoded: string;
      try {
        decoded = atob(loginCode.trim());
      } catch {
        throw new Error("Invalid login code format (not valid base64)");
      }

      let tokens: { accessToken?: string; refreshToken?: string };
      try {
        tokens = JSON.parse(decoded);
      } catch {
        throw new Error("Invalid login code format (not valid JSON)");
      }

      const { accessToken, refreshToken } = tokens;

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid login code: missing tokens");
      }

      console.log("[login-code-modal] Tokens extracted, accessToken length:", accessToken.length);
      console.log("[login-code-modal] Getting Supabase client...");

      const supabase = getSupabaseClient();
      console.log("[login-code-modal] Setting session...");

      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        console.error("[login-code-modal] Session error:", sessionError);
        throw sessionError;
      }

      console.log("[login-code-modal] Session set successfully, user:", data.user?.email);
      // Force a small delay then reload to ensure state is persisted
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.reload();
    } catch (err) {
      console.error("[login-code-modal] Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      if (document.visibilityState === "visible") {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
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
            disabled={loading}
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
            type="text"
            value={loginCode}
            onChange={(e) => setLoginCode(e.target.value)}
            placeholder="Paste login code here..."
            className="w-full px-3 py-2 text-sm font-mono border border-border focus:outline-none focus:border-black"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && loginCode.trim() && !loading) {
                handleCodeLogin();
              }
            }}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm border border-border hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCodeLogin}
              disabled={loading || !loginCode.trim()}
              className="flex-1 px-4 py-2 text-sm border border-black bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
