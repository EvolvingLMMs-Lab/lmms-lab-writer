"use client";

import { useState } from "react";
import { Github } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";

export function LoginForm() {
  const [showManual, setShowManual] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    import("@tauri-apps/plugin-shell").then(({ open }) => {
      open("https://writer.lmms-lab.com/login?source=desktop");
    });
  };

  const handleManualLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const parsed = JSON.parse(tokenInput);
      const { accessToken, refreshToken } = parsed;

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid token format");
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
      setError(err instanceof Error ? err.message : "Failed to parse tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
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

      {/* Manual token paste for development */}
      <div className="border-t border-border pt-4 mt-4">
        <button
          onClick={() => setShowManual(!showManual)}
          className="text-xs text-muted hover:text-foreground underline w-full text-center"
        >
          {showManual ? "Hide manual login" : "Manual login (Dev mode)"}
        </button>

        {showManual && (
          <div className="mt-4">
            <p className="text-xs text-muted mb-2">
              Paste the tokens from the web login page:
            </p>
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder='{"accessToken": "...", "refreshToken": "..."}'
              className="w-full px-3 py-2 text-xs font-mono border border-border focus:outline-none focus:border-black resize-none h-20"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            <button
              onClick={handleManualLogin}
              disabled={loading || !tokenInput.trim()}
              className="mt-2 px-3 py-1.5 text-xs border border-black bg-white hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              {loading ? "Logging in..." : "Login with Tokens"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
