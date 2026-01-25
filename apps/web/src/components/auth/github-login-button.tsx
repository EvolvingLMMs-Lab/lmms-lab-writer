"use client";

import { useState } from "react";
import { Github } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function GitHubLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleGitHubLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      onClick={handleGitHubLogin}
      disabled={loading}
      className="btn btn-secondary inline-flex items-center gap-2"
    >
      <Github className="w-4 h-4" />
      {loading ? "Connecting..." : "Connect GitHub"}
    </button>
  );
}
