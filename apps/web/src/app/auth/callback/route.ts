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
    const cookieHeader = request.headers.get("cookie") || "";
    const authSourceMatch = cookieHeader.match(/auth_source=([^;]+)/);
    if (authSourceMatch) {
      source = authSourceMatch[1] ?? null;
    }
  }

  if (error_param) {
    const errorMsg = encodeURIComponent(error_description || error_param);
    if (source === "desktop") {
      return NextResponse.redirect(`${origin}/auth/desktop-success?error=${errorMsg}`);
    }
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
  }

  if (code) {
    // Note: Desktop flow redirects directly to /auth/desktop-success, not through this callback
    // Web flow uses SSR client (stores session in cookies)
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorMsg = encodeURIComponent(error.message);
      return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
    }

    const session = data.session;

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
    return NextResponse.redirect(`${origin}/auth/post-login`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
