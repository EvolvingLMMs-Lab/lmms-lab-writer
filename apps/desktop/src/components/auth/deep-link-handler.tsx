"use client";

import { useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export function DeepLinkHandler() {
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupDeepLinkListener = async () => {
      try {
        const { onOpenUrl } = await import("@tauri-apps/plugin-deep-link");

        unsubscribe = await onOpenUrl((urls) => {
          for (const url of urls) {
            handleDeepLink(url);
          }
        });
      } catch (err) {
        // Deep link plugin not available (e.g., in browser dev mode)
        console.debug("Deep link plugin not available:", err);
      }
    };

    setupDeepLinkListener();

    return () => {
      unsubscribe?.();
    };
  }, []);

  return null;
}

async function handleDeepLink(url: string) {
  try {
    const parsed = new URL(url);

    // Handle auth callback: lmms-writer://auth/callback?access_token=...&refresh_token=...
    if (parsed.host === "auth" && parsed.pathname === "/callback") {
      const error = parsed.searchParams.get("error");

      if (error) {
        console.error("OAuth error from deep link:", decodeURIComponent(error));
        // Could dispatch an event or use a toast here
        return;
      }

      const accessToken = parsed.searchParams.get("access_token");
      const refreshToken = parsed.searchParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const supabase = getSupabaseClient();
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error("Failed to set session from deep link:", sessionError);
        } else {
          console.log("Session set successfully from deep link");
          // Trigger a page refresh to update auth state
          window.location.reload();
        }
      }
    }
  } catch (err) {
    console.error("Failed to handle deep link:", err);
  }
}
