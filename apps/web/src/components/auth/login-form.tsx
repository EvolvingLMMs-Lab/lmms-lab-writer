"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Github } from "lucide-react";
import { createClient as createSSRClient } from "@/lib/supabase/client";
import { createClient as createStandardClient } from "@supabase/supabase-js";
import { useLocale } from "@/lib/useLocale";
import { getMessages } from "@/lib/messages";

export function LoginForm() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();
  const t = getMessages(locale);

  // Get appropriate Supabase client based on flow
  const getSupabaseClient = () => {
    if (source === "desktop") {
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

    try {
      const supabase = getSupabaseClient();

      // Preserve source parameter (e.g., desktop) through OAuth flow
      if (source === "desktop") {
        sessionStorage.setItem("auth_source", "desktop");
        localStorage.setItem("auth_source", "desktop");
        // Also preserve callback_port for auto-login feature
        const callbackPort = searchParams.get("callback_port");
        if (callbackPort) {
          sessionStorage.setItem("auth_callback_port", callbackPort);
          localStorage.setItem("auth_callback_port", callbackPort);
        }
      } else {
        sessionStorage.removeItem("auth_source");
        sessionStorage.removeItem("auth_callback_port");
        localStorage.removeItem("auth_source");
        localStorage.removeItem("auth_callback_port");
      }

      // For desktop flow, redirect directly to desktop-success to keep PKCE state
      // For web flow, use callback route to handle session cookies
      const callbackUrl = source === "desktop"
        ? `${window.location.origin}/auth/desktop-success`
        : `${window.location.origin}/auth/callback`;

      // For desktop flow, store code_verifier in sessionStorage as backup
      // since cookie storage might not work across page navigations
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: callbackUrl,
        },
      });
      // Check if PKCE is being used (URL should contain code_challenge)
      if (data?.url) {
        const _urlHasCodeChallenge = data.url.includes("code_challenge");
      }
      // Log ALL localStorage keys to see where code_verifier is stored
      const _allKeys = Object.keys(localStorage);

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
        {loading ? t.auth.connecting : t.auth.continueWithGitHub}
      </button>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      <p className="text-xs text-muted text-center mt-6">
        {t.auth.githubAccountRequired}
      </p>
    </>
  );
}
