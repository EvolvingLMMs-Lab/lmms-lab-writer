"use client";

import { useEffect } from "react";

/**
 * Intercepts external links and opens them in system browser instead of WebView.
 * Required because Tauri WebView lacks cookies/sessions for OAuth flows.
 */
export function ExternalLinkHandler() {
  useEffect(() => {
    const handleClick = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const isExternal =
        href.startsWith("http://") || href.startsWith("https://");
      const isSameOrigin =
        isExternal && new URL(href).origin === window.location.origin;

      if (isExternal && !isSameOrigin) {
        e.preventDefault();
        e.stopPropagation();

        try {
          const { open } = await import("@tauri-apps/plugin-shell");
          await open(href);
        } catch (err) {
          console.error("Failed to open external link:", err);
          window.open(href, "_blank");
        }
      }
    };

    const originalWindowOpen = window.open;
    window.open = function (
      url?: string | URL,
      target?: string,
      features?: string,
    ) {
      const urlString = url?.toString() ?? "";
      const isExternal =
        urlString.startsWith("http://") || urlString.startsWith("https://");
      const isSameOrigin =
        isExternal && new URL(urlString).origin === window.location.origin;

      if (isExternal && !isSameOrigin) {
        import("@tauri-apps/plugin-shell")
          .then(({ open }) => open(urlString))
          .catch(console.error);
        return null;
      }

      return originalWindowOpen.call(window, url, target, features);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.open = originalWindowOpen;
    };
  }, []);

  return null;
}
