"use client";

import { useState } from "react";
import { Github } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Props = {
  onSuccess?: () => void;
};

export function LoginForm({ onSuccess }: Props) {
  const { signInWithGitHub, signInWithEmail, signUp, error, loading } =
    useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [signupMessage, setSignupMessage] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSignupMessage(null);

    if (mode === "signup") {
      const result = await signUp(email, password);
      if (result.success) {
        setSignupMessage(result.message);
      } else {
        setLocalError(result.message);
      }
    } else {
      await signInWithEmail(email, password);
      onSuccess?.();
    }
  };

  const displayError = localError || error;

  return (
    <div className="w-full max-w-sm">
      <button
        onClick={signInWithGitHub}
        disabled={loading}
        className="btn btn-secondary w-full mb-6 flex items-center justify-center gap-2"
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

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-border focus:outline-none focus:border-black"
            placeholder="you@example.com"
            required
            disabled={loading}
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
            className="w-full px-3 py-2 border border-border focus:outline-none focus:border-black"
            placeholder="Your password"
            required
            disabled={loading}
          />
        </div>

        {displayError && <p className="text-sm text-red-600">{displayError}</p>}

        {signupMessage && (
          <p className="text-sm text-green-600">{signupMessage}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-secondary w-full"
        >
          {loading
            ? "Loading..."
            : mode === "signup"
              ? "Sign up with Email"
              : "Sign in with Email"}
        </button>
      </form>

      <p className="text-sm text-muted text-center mt-6">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              onClick={() => setMode("signup")}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => setMode("login")}
              className="underline underline-offset-2 hover:text-foreground"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
