"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/useLocale";
import { getMessages } from "@/lib/messages";
import { createClient as createStandardClient } from "@supabase/supabase-js";

type CallbackStatus = "pending" | "sending" | "sent" | "failed";

function createDesktopSupabaseClient() {
  return createStandardClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        persistSession: true,
        storage: window.localStorage,
      },
    },
  );
}

function DesktopSuccessContent() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginCode, setLoginCode] = useState<string | null>(null);
  const [callbackStatus, setCallbackStatus] = useState<CallbackStatus>("pending");
  // Get callback_port from URL or sessionStorage (OAuth flow loses URL params)
  const [callbackPort, setCallbackPort] = useState<string | null>(null);
  const locale = useLocale();
  const t = getMessages(locale);

  useEffect(() => {
    const portFromUrl = searchParams.get("callback_port");
    const portFromStorage = sessionStorage.getItem("auth_callback_port");
    const portFromLocalStorage = localStorage.getItem("auth_callback_port");
    const port = portFromUrl || portFromStorage || portFromLocalStorage;

    if (port) {
      setCallbackPort(port);
      // Clean up sessionStorage after reading
      if (portFromStorage) {
        sessionStorage.removeItem("auth_callback_port");
      }
      if (portFromLocalStorage) {
        localStorage.removeItem("auth_callback_port");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const loadTokens = async () => {

      // Check for error in query params
      const errorParam = searchParams.get("error");

      if (errorParam) {
        setError(decodeURIComponent(errorParam));
        return;
      }

      // Check for PKCE code in query params (PKCE flow)
      const authCode = searchParams.get("code");
      if (authCode) {
        // Preferred path: let Supabase exchange code using internally managed PKCE verifier.
        try {
          const supabase = createDesktopSupabaseClient();
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(authCode);

          if (!exchangeError && data.session?.access_token && data.session.refresh_token) {
            const code = btoa(
              JSON.stringify({
                accessToken: data.session.access_token,
                refreshToken: data.session.refresh_token,
              }),
            );
            setLoginCode(code);
            return;
          }
        } catch {
          // Continue to legacy fallback below
        }

        // Legacy fallback: read code_verifier manually from storage
        const allKeys = [
          ...Object.keys(localStorage),
          ...Object.keys(sessionStorage),
        ];

        const codeVerifierKey = allKeys.find(k => k.includes('code-verifier'));
        if (!codeVerifierKey) {
          setError("Authentication data missing. Please try logging in again.");
          return;
        }

        const codeVerifierRaw =
          localStorage.getItem(codeVerifierKey) ||
          sessionStorage.getItem(codeVerifierKey);

        // Parse the code_verifier (it's stored as JSON string)
        let codeVerifier: string;
        try {
          codeVerifier = JSON.parse(codeVerifierRaw || '""');
        } catch {
          codeVerifier = codeVerifierRaw || '';
        }

        if (!codeVerifier) {
          setError("Authentication data invalid. Please try logging in again.");
          return;
        }

        try {
          // Call Supabase token endpoint directly with PKCE
          const tokenUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=pkce`;

          const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify({
              auth_code: authCode,
              code_verifier: codeVerifier,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.access_token) {
            setError(data.error_description || data.msg || data.error || "Failed to get tokens");
            return;
          }

          // Create login code from tokens
          const code = btoa(JSON.stringify({
            accessToken: data.access_token,
            refreshToken: data.refresh_token
          }));

          // Clear the code_verifier from storage
          localStorage.removeItem(codeVerifierKey);
          sessionStorage.removeItem(codeVerifierKey);

          setLoginCode(code);
          return;
        } catch (err) {
          console.error("[desktop-success] Token exchange exception:", err);
          setError("Failed to complete authentication. Please try again.");
          return;
        }
      }

      // Parse hash fragment (OAuth implicit flow returns tokens in hash - fallback)
      const hash = window.location.hash.substring(1); // Remove leading #
      const hashParams = new URLSearchParams(hash);

      // Check for error in hash
      const hashError = hashParams.get("error");
      if (hashError) {
        const errorDesc = hashParams.get("error_description") || hashError;
        setError(decodeURIComponent(errorDesc));
        return;
      }

      // Get tokens from hash fragment (implicit flow - has short refresh token)
      let accessToken = hashParams.get("access_token");
      let refreshToken = hashParams.get("refresh_token");

      // If tokens found in hash, use them (note: refresh_token may be short/placeholder)
      if (accessToken && refreshToken) {
        const code = btoa(JSON.stringify({ accessToken, refreshToken }));
        setLoginCode(code);
        // Clear hash from URL for security
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      // Fallback: check query params (legacy flow)
      accessToken = searchParams.get("access_token");
      refreshToken = searchParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const code = btoa(JSON.stringify({ accessToken, refreshToken }));
        setLoginCode(code);
        return;
      }
      setError("Missing authentication tokens. Please try logging in again.");
    };

    loadTokens();
  }, [searchParams]);

  // Send code to desktop callback server when available
  useEffect(() => {
    if (!loginCode || !callbackPort) return;

    const sendToCallback = async () => {
      setCallbackStatus("sending");
      try {
        const response = await fetch(`http://127.0.0.1:${callbackPort}/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: loginCode }),
        });

        if (response.ok) {
          setCallbackStatus("sent");
        } else {
          setCallbackStatus("failed");
        }
      } catch {
        setCallbackStatus("failed");
      }
    };

    sendToCallback();
  }, [loginCode, callbackPort]);

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
          <h1 className="text-xl font-medium mb-2">{t.desktopSuccess.loginFailed}</h1>
          <p className="text-muted text-sm mb-6">{error}</p>
          <a
            href="/login?source=desktop"
            className="inline-block px-4 py-2 border-2 border-black bg-white hover:bg-neutral-50 transition-colors"
          >
            {t.desktopSuccess.tryAgain}
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
          <h1 className="text-xl font-medium">{t.common.loading}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className={`w-12 h-12 border-2 flex items-center justify-center mx-auto mb-4 ${
            callbackStatus === "sent" ? "border-green-600" : "border-black"
          }`}>
            {callbackStatus === "sending" ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <svg
                className={`w-6 h-6 ${callbackStatus === "sent" ? "text-green-600" : ""}`}
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
            )}
          </div>
          <h1 className="text-xl font-medium mb-2">
            {callbackStatus === "sent" ? t.desktopSuccess.loggedIn : t.desktopSuccess.loginSuccessful}
          </h1>
          <p className="text-muted text-sm">
            {callbackStatus === "sending" && t.desktopSuccess.sendingCode}
            {callbackStatus === "sent" && t.desktopSuccess.codeSent}
            {(callbackStatus === "failed" || callbackStatus === "pending") &&
              t.desktopSuccess.copyCodePrompt}
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
              {copied ? t.desktopSuccess.copied : t.desktopSuccess.copyCode}
            </button>
          </div>
          <p className="text-xs text-muted">
            {callbackStatus === "sent"
              ? t.desktopSuccess.codeManualCopy
              : t.desktopSuccess.codeExpires}
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted text-center mt-6">
          {callbackStatus === "sent"
            ? t.desktopSuccess.returnToDesktop
            : t.desktopSuccess.closeWindow}
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
