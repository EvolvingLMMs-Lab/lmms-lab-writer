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

  if (!source) {
    const cookies = request.headers.get("cookie") || "";
    console.log("[auth/callback] Cookies:", cookies);
    const authSourceMatch = cookies.match(/auth_source=([^;]+)/);
    if (authSourceMatch) {
      source = authSourceMatch[1] ?? null;
      console.log("[auth/callback] Source from cookie:", source);
    }
  }

  console.log("[auth/callback] Final source:", source);

  if (error_param) {
    const errorMsg = encodeURIComponent(error_description || error_param);
    if (source === "desktop") {
      return NextResponse.redirect(`${origin}/auth/desktop-success?error=${errorMsg}`);
    }
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorMsg = encodeURIComponent(error.message);
      if (source === "desktop") {
        return NextResponse.redirect(`${origin}/auth/desktop-success?error=${errorMsg}`);
      }
      return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
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

    // Desktop flow: redirect to desktop-success page with tokens
    if (source === "desktop" && session) {
      console.log("[auth/callback] Desktop flow - redirecting to desktop-success with tokens");
      console.log("[auth/callback] access_token length:", session.access_token.length);
      console.log("[auth/callback] refresh_token length:", session.refresh_token.length);

      const params = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      const redirectUrl = `${origin}/auth/desktop-success?${params}`;
      console.log("[auth/callback] Redirect URL (truncated):", redirectUrl.substring(0, 100) + "...");

      const response = NextResponse.redirect(redirectUrl);
      // Clear the auth_source cookie
      response.cookies.set("auth_source", "", { path: "/", maxAge: 0 });
      return response;
    }

    console.log("[auth/callback] Non-desktop flow - redirecting to post-login");
    // Check sessionStorage backup (handled by post-login page)
    return NextResponse.redirect(`${origin}/auth/post-login`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
