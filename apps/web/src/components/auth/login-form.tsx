"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Github } from "lucide-react";
import { createClient as createSSRClient } from "@/lib/supabase/client";
import { createClient as createStandardClient } from "@supabase/supabase-js";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get appropriate Supabase client based on flow
  const getSupabaseClient = () => {
    if (source === "desktop") {
      // Use standard client with PKCE flow for desktop
      // Don't use custom storageKey - let Supabase use default (project ref)
      console.log("[LoginForm] Creating standard client with PKCE flow");
      return createStandardClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            flowType: "pkce",
            persistSession: true,
          },
        }
      );
    }
    // Use SSR client (cookies) for web flow
    return createSSRClient();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If from desktop, redirect to desktop-success page with tokens
    if (source === "desktop") {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const params = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        window.location.href = `/auth/desktop-success?${params}`;
        return;
      }
    }

    startTransition(() => {
      router.push("/profile");
    });
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
        console.log("[LoginForm] Set auth_source in sessionStorage");
      } else {
        sessionStorage.removeItem("auth_source");
        console.log("[LoginForm] Cleared auth_source");
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
        className="btn btn-secondary w-full mb-6"
      >
        <Github className="w-4 h-4" />
        Continue with GitHub
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted">Or</span>
        </div>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Your password"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-secondary w-full"
        >
          {loading ? "Signing in..." : "Sign in with Email"}
        </button>
      </form>

      <p className="text-sm text-muted text-center mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
