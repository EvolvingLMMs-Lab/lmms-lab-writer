"use client";

import { useState } from "react";
import { Github } from "lucide-react";
import { LoginCodeModal } from "./login-code-modal";

const WEB_URL =
  process.env.NEXT_PUBLIC_WEB_URL || "https://writer.lmms-lab.com";

export function LoginForm() {
  const [showCodeModal, setShowCodeModal] = useState(false);

  const handleLogin = () => {
    import("@tauri-apps/plugin-shell").then(({ open }) => {
      open(`${WEB_URL}/login?source=desktop`);
    });
    // Show the login code modal so user can paste code after web login
    setShowCodeModal(true);
  };

  return (
    <>
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
        <button
          onClick={() => setShowCodeModal(true)}
          className="w-full text-sm text-muted hover:text-foreground transition-colors"
        >
          Use login code
        </button>
      </div>

      <LoginCodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
      />
    </>
  );
}
