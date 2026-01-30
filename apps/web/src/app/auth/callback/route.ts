import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getGitHubUser, storeGitHubToken } from "@/lib/github/stars";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error_param = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // Check source from URL first, then from cookie as backup
  let source: string | null = searchParams.get("source");
  if (!source) {
    const cookies = request.headers.get("cookie") || "";
    const authSourceMatch = cookies.match(/auth_source=([^;]+)/);
    if (authSourceMatch) {
      source = authSourceMatch[1] ?? null;
    }
  }

  console.log("[auth/callback] URL:", request.url);
  console.log("[auth/callback] source:", source, "code exists:", !!code);

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
      const params = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      const response = NextResponse.redirect(`${origin}/auth/desktop-success?${params}`);
      // Clear the auth_source cookie
      response.cookies.set("auth_source", "", { path: "/", maxAge: 0 });
      return response;
    }

    // Check sessionStorage backup (handled by post-login page)
    return NextResponse.redirect(`${origin}/auth/post-login`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
