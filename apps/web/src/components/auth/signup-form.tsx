"use client";

import { useState } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/useLocale";
import { getMessages } from "@/lib/messages";

export function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locale = useLocale();
  const t = getMessages(locale);

  const handleGitHubSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
      setError(e instanceof Error ? e.message : "GitHub signup failed");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleGitHubSignup}
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

      <p className="text-sm text-muted text-center mt-4">
        {t.auth.alreadyHaveAccount}{" "}
        <Link
          href="/login"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {t.auth.signInLink}
        </Link>
      </p>
    </>
  );
}
