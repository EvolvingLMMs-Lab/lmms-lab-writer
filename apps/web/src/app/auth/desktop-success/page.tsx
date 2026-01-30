"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function DesktopSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"redirecting" | "success" | "fallback">(
    "redirecting"
  );
  const [tokens, setTokens] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const error = searchParams.get("error");

    if (error) {
      setStatus("fallback");
      return;
    }

    if (!accessToken || !refreshToken) {
      setStatus("fallback");
      return;
    }

    // Store tokens for manual copy fallback
    setTokens({ accessToken, refreshToken });

    // Try to redirect to desktop app via deep link
    const deepLinkUrl = `lmms-writer://auth/callback?access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;

    // Try to redirect to desktop app via deep link
    // Use window.location.href for direct navigation
    window.location.href = deepLinkUrl;

    // After a short delay, assume success (user may have been redirected)
    const timer = setTimeout(() => {
      setStatus("success");
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [searchParams]);

  const handleCopyTokens = async () => {
    if (!tokens) return;
    const tokenString = JSON.stringify(tokens, null, 2);
    await navigator.clipboard.writeText(tokenString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        {status === "redirecting" && (
          <>
            <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-medium mb-2">Opening LMMs-Lab Writer...</h1>
            <p className="text-muted text-sm">
              Please wait while we redirect you to the app.
            </p>
          </>
        )}

        {status === "success" && (
          <>
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
            <p className="text-muted text-sm mb-6">
              You can now close this window and return to the desktop app.
            </p>
            <p className="text-xs text-muted mb-4">
              If the app didn&apos;t open automatically, please return to it manually.
            </p>

            {/* Manual token copy for development */}
            {tokens && (
              <div className="border-t border-border pt-4 mt-4">
                <button
                  onClick={() => setShowManual(!showManual)}
                  className="text-xs text-muted hover:text-foreground underline"
                >
                  {showManual ? "Hide" : "App didn't open?"} (Dev mode)
                </button>

                {showManual && (
                  <div className="mt-4 text-left">
                    <p className="text-xs text-muted mb-2">
                      Copy these tokens and paste them in the desktop app:
                    </p>
                    <div className="bg-neutral-100 p-3 rounded text-xs font-mono break-all max-h-32 overflow-auto">
                      {JSON.stringify(tokens, null, 2)}
                    </div>
                    <button
                      onClick={handleCopyTokens}
                      className="mt-2 px-3 py-1.5 text-xs border border-black bg-white hover:bg-neutral-50 transition-colors"
                    >
                      {copied ? "Copied!" : "Copy Tokens"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {status === "fallback" && (
          <>
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
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-medium mb-2">Return to App</h1>
            <p className="text-muted text-sm mb-6">
              Please return to LMMs-Lab Writer and try signing in again.
            </p>
            <p className="text-xs text-muted">
              The desktop app needs to be installed for automatic login to work.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-medium mb-2">Loading...</h1>
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
