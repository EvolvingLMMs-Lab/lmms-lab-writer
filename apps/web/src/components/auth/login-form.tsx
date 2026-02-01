"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Github } from "lucide-react";
import { createClient as createSSRClient } from "@/lib/supabase/client";
import { createClient as createStandardClient } from "@supabase/supabase-js";

export function LoginForm() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get appropriate Supabase client based on flow
  const getSupabaseClient = () => {
    if (source === "desktop") {
      // Use standard client with PKCE flow for desktop
      // Explicitly set storage to window.localStorage
      console.log("[LoginForm] Creating standard client with PKCE flow");
      return createStandardClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            flowType: "pkce",
            persistSession: true,
            storage: window.localStorage,
          },
        }
      );
    }
    // Use SSR client (cookies) for web flow
    return createSSRClient();
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError(null);

    console.log("=== [LoginForm] GitHub Login Started ===");
    console.log("[LoginForm] Current URL:", window.location.href);
    console.log("[LoginForm] source param:", source);

    try {
      const supabase = getSupabaseClient();
      console.log("[LoginForm] Using", source === "desktop" ? "standard" : "SSR", "client");

      // Preserve source parameter (e.g., desktop) through OAuth flow
      if (source === "desktop") {
        sessionStorage.setItem("auth_source", "desktop");
        // Also preserve callback_port for auto-login feature
        const callbackPort = searchParams.get("callback_port");
        if (callbackPort) {
          sessionStorage.setItem("auth_callback_port", callbackPort);
          console.log("[LoginForm] Set auth_callback_port in sessionStorage:", callbackPort);
        }
        console.log("[LoginForm] Set auth_source in sessionStorage");
      } else {
        sessionStorage.removeItem("auth_source");
        sessionStorage.removeItem("auth_callback_port");
        console.log("[LoginForm] Cleared auth_source and auth_callback_port");
      }

      // For desktop flow, redirect directly to desktop-success to keep PKCE state
      // For web flow, use callback route to handle session cookies
      const callbackUrl = source === "desktop"
        ? `${window.location.origin}/auth/desktop-success`
        : `${window.location.origin}/auth/callback`;
      console.log("[LoginForm] Callback URL:", callbackUrl);

      // For desktop flow, store code_verifier in sessionStorage as backup
      // since cookie storage might not work across page navigations
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: callbackUrl,
        },
      });

      console.log("[LoginForm] signInWithOAuth result:", { hasData: !!data, hasUrl: !!data?.url, error: error?.message });
      console.log("[LoginForm] OAuth URL:", data?.url);
      // Check if PKCE is being used (URL should contain code_challenge)
      if (data?.url) {
        const urlHasCodeChallenge = data.url.includes("code_challenge");
        console.log("[LoginForm] PKCE enabled (has code_challenge):", urlHasCodeChallenge);
      }
      // Log ALL localStorage keys to see where code_verifier is stored
      const allKeys = Object.keys(localStorage);
      console.log("[LoginForm] All localStorage keys:", allKeys);
      console.log("[LoginForm] code_verifier key:", allKeys.find(k => k.includes('code-verifier')) || 'NOT FOUND');

      if (error) {
        setError(`GitHub OAuth error: ${error.message}`);
        setLoading(false);
        return;
      }
      if (!data?.url) {
        setError(
          "GitHub OAuth not configured. Please check Supabase settings.",
        );
        setLoading(false);
        return;
      }

      console.log("[LoginForm] Redirecting to Supabase OAuth URL...");
      window.location.href = data.url;
    } catch (e) {
      console.error("[LoginForm] Exception:", e);
      setError(e instanceof Error ? e.message : "GitHub login failed");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleGitHubLogin}
        disabled={loading}
        className="btn btn-secondary w-full"
      >
        <Github className="w-4 h-4" />
        {loading ? "Connecting..." : "Continue with GitHub"}
      </button>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      <p className="text-xs text-muted text-center mt-6">
        GitHub account required to track starred repositories and earn inks.
      </p>
    </>
  );
}
