"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Github } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
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
    try {
      const supabase = createClient();
      // Preserve source parameter (e.g., desktop) through OAuth flow
      // Store in sessionStorage as backup since Supabase may not preserve query params
      if (source) {
        sessionStorage.setItem("auth_source", source);
      }
      const callbackUrl = source
        ? `${window.location.origin}/auth/callback?source=${source}`
        : `${window.location.origin}/auth/callback`;
      console.log("[LoginForm] source:", source, "callbackUrl:", callbackUrl);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: callbackUrl,
        },
      });
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
