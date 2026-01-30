"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function DesktopSuccessContent() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    if (accessToken && refreshToken) {
      setTokens({ accessToken, refreshToken });
    }
  }, [searchParams]);

  const handleOpenApp = () => {
    if (!tokens) return;
    const deepLinkUrl = `lmms-writer://auth/callback?access_token=${encodeURIComponent(tokens.accessToken)}&refresh_token=${encodeURIComponent(tokens.refreshToken)}`;
    window.location.href = deepLinkUrl;
  };

  const handleCopyToken = async () => {
    if (!tokens) return;
    // Create a simple login code from tokens
    const loginCode = btoa(JSON.stringify(tokens));
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

  if (!tokens) {
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
            Choose one of the options below to continue to the app.
          </p>
        </div>

        {/* Option 1: Open App (Deep Link) */}
        <div className="border-2 border-black p-4 mb-4">
          <h2 className="font-medium mb-2">Option 1: Open App Directly</h2>
          <p className="text-sm text-muted mb-3">
            Click the button below to open LMMs-Lab Writer automatically.
          </p>
          <button
            onClick={handleOpenApp}
            className="w-full px-4 py-2 border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors font-medium"
          >
            Open LMMs-Lab Writer
          </button>
        </div>

        {/* Option 2: Copy Login Code */}
        <div className="border border-neutral-300 p-4">
          <h2 className="font-medium mb-2">Option 2: Use Login Code</h2>
          <p className="text-sm text-muted mb-3">
            If the app doesn&apos;t open, copy this code and paste it in the app.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={btoa(JSON.stringify(tokens)).slice(0, 20) + "..."}
              className="flex-1 px-3 py-2 text-sm font-mono bg-neutral-100 border border-neutral-200 truncate"
            />
            <button
              onClick={handleCopyToken}
              className="px-4 py-2 border border-black bg-white hover:bg-neutral-50 transition-colors text-sm whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted text-center mt-6">
          You can close this window after returning to the app.
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
