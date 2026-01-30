"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function DesktopSuccessContent() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginCode, setLoginCode] = useState<string | null>(null);

  useEffect(() => {
    const loadTokens = async () => {
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError(decodeURIComponent(errorParam));
        return;
      }

      // Try to get tokens from URL first
      let accessToken = searchParams.get("access_token");
      let refreshToken = searchParams.get("refresh_token");

      // If not in URL, get from current session
      if (!accessToken || !refreshToken) {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          accessToken = session.access_token;
          refreshToken = session.refresh_token;
        }
      }

      if (accessToken && refreshToken) {
        // Create login code from tokens
        const code = btoa(JSON.stringify({ accessToken, refreshToken }));
        setLoginCode(code);
      } else {
        setError("No active session found. Please login again.");
      }
    };

    loadTokens();
  }, [searchParams]);

  const handleCopy = async () => {
    if (!loginCode) return;
    await navigator.clipboard.writeText(loginCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-medium mb-2">Login Failed</h1>
          <p className="text-muted text-sm mb-6">{error}</p>
          <a
            href="/login?source=desktop"
            className="inline-block px-4 py-2 border-2 border-black bg-white hover:bg-neutral-50 transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  if (!loginCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-8 text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-medium">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 border-2 border-black flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-medium mb-2">Login Successful!</h1>
          <p className="text-muted text-sm">
            Copy the login code below and paste it in the desktop app.
          </p>
        </div>

        {/* Login Code */}
        <div className="border-2 border-black p-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              readOnly
              value={loginCode.slice(0, 30) + "..."}
              className="flex-1 px-3 py-2 text-sm font-mono bg-neutral-100 border border-neutral-200 truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 border-2 transition-colors text-sm whitespace-nowrap font-medium ${
                copied
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-black bg-black text-white hover:bg-neutral-800"
              }`}
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
          <p className="text-xs text-muted">
            This code expires when your session expires. Get a new code if login fails.
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted text-center mt-6">
          You can close this window after pasting the code in the app.
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-medium">Loading...</h1>
      </div>
    </div>
  );
}

export default function DesktopSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DesktopSuccessContent />
    </Suspense>
  );
}
