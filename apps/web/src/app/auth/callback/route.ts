import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getGitHubUser, storeGitHubToken } from "@/lib/github/stars";

export async function GET(request: Request) {
  console.log("=== [auth/callback] Callback Route Hit ===");

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error_param = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  console.log("[auth/callback] Full URL:", request.url);
  console.log("[auth/callback] Origin:", origin);
  console.log("[auth/callback] Code exists:", !!code);
  console.log("[auth/callback] Error param:", error_param);

  // Check source from URL first, then from cookie as backup
  let source: string | null = searchParams.get("source");
  console.log("[auth/callback] Source from URL:", source);

  // Check for desktop local callback redirect_uri
  const desktopRedirectUri = searchParams.get("desktop_redirect_uri");
  console.log("[auth/callback] Desktop redirect_uri:", desktopRedirectUri);

  if (!source) {
    const cookieHeader = request.headers.get("cookie") || "";
    console.log("[auth/callback] Cookies:", cookieHeader);
    const authSourceMatch = cookieHeader.match(/auth_source=([^;]+)/);
    if (authSourceMatch) {
      source = authSourceMatch[1] ?? null;
      console.log("[auth/callback] Source from cookie:", source);
    }
  }

  console.log("[auth/callback] Final source:", source);

  // Helper to redirect to desktop local server
  const redirectToDesktopLocal = (params: URLSearchParams) => {
    if (desktopRedirectUri && desktopRedirectUri.startsWith("http://localhost:")) {
      const redirectUrl = new URL(desktopRedirectUri);
      params.forEach((value, key) => redirectUrl.searchParams.set(key, value));
      console.log("[auth/callback] Redirecting to desktop local server:", redirectUrl.toString());
      return NextResponse.redirect(redirectUrl.toString());
    }
    return null;
  };

  if (error_param) {
    const errorMsg = error_description || error_param;

    // Try desktop local redirect first
    const desktopResponse = redirectToDesktopLocal(new URLSearchParams({
      error: errorMsg,
    }));
    if (desktopResponse) return desktopResponse;

    if (source === "desktop") {
      return NextResponse.redirect(`${origin}/auth/desktop-success?error=${encodeURIComponent(errorMsg)}`);
    }
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  if (code) {
    // Note: Desktop flow redirects directly to /auth/desktop-success, not through this callback
    // Web flow uses SSR client (stores session in cookies)
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorMsg = error.message;

      // Try desktop local redirect first
      const desktopResponse = redirectToDesktopLocal(new URLSearchParams({
        error: errorMsg,
      }));
      if (desktopResponse) return desktopResponse;

      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
    }

    const session = data.session;
    console.log("[auth/callback] session exists:", !!session);
    console.log("[auth/callback] access_token length:", session?.access_token?.length);
    console.log("[auth/callback] refresh_token length:", session?.refresh_token?.length);

    // Store GitHub token if available
    if (session?.provider_token && session.user) {
      try {
        const githubUser = await getGitHubUser(session.provider_token);
        await storeGitHubToken(
          supabase,
          session.user.id,
          githubUser,
          session.provider_token,
          session.provider_refresh_token ? "with_refresh" : undefined,
        );
      } catch {
        // Silently fail - not critical
      }
    }

    // If desktop local redirect is specified, redirect with tokens
    if (session && desktopRedirectUri) {
      const desktopResponse = redirectToDesktopLocal(new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      }));
      if (desktopResponse) return desktopResponse;
    }

    console.log("[auth/callback] Web flow - redirecting to post-login");
    return NextResponse.redirect(`${origin}/auth/post-login`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
