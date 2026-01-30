"use client";

import { Github } from "lucide-react";

export function LoginForm() {
  const handleLogin = () => {
    import("@tauri-apps/plugin-shell").then(({ open }) => {
      open("https://writer.lmms-lab.com/login?source=desktop");
    });
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
    </div>
  );
}
