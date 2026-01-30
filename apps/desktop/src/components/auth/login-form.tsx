"use client";

import { useState } from "react";
import { Github } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL || "https://writer.lmms-lab.com";

export function LoginForm() {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    import("@tauri-apps/plugin-shell").then(({ open }) => {
      open(`${WEB_URL}/login?source=desktop`);
    });
  };

  const handleCodeLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      // Decode the login code (base64 encoded JSON)
      const decoded = atob(loginCode.trim());
      const { accessToken, refreshToken } = JSON.parse(decoded);

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid login code");
      }

      const supabase = getSupabaseClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        throw sessionError;
      }

      // Reload to update auth state
      window.location.reload();
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Invalid login code format");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Primary: GitHub Login */}
      <button
        onClick={handleLogin}
        className="btn btn-secondary w-full flex items-center justify-center gap-2"
      >
        <Github className="w-4 h-4" />
        Continue with GitHub
      </button>

      <p className="text-xs text-muted text-center mt-4">
        You&apos;ll be redirected to sign in via browser
      </p>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted">or</span>
        </div>
      </div>

      {/* Secondary: Login Code */}
      {!showCodeInput ? (
        <button
          onClick={() => setShowCodeInput(true)}
          className="w-full text-sm text-muted hover:text-foreground transition-colors"
        >
          Use login code
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Paste the login code from the web page:
          </p>
          <input
            type="text"
            value={loginCode}
            onChange={(e) => setLoginCode(e.target.value)}
            placeholder="Paste login code here..."
            className="w-full px-3 py-2 text-sm font-mono border border-border focus:outline-none focus:border-black"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowCodeInput(false);
                setLoginCode("");
                setError(null);
              }}
              className="flex-1 px-3 py-2 text-sm border border-border hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCodeLogin}
              disabled={loading || !loginCode.trim()}
              className="flex-1 px-3 py-2 text-sm border border-black bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
