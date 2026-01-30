import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getGitHubUser, storeGitHubToken } from "@/lib/github/stars";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error_param = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/profile";
  const source = searchParams.get("source");

  console.log("[auth/callback] Full URL:", request.url);
  console.log("[auth/callback] source:", source, "code exists:", !!code);

  if (error_param) {
    console.error("OAuth error:", error_param, error_description);
    const errorMsg = encodeURIComponent(error_description || error_param);

    // If from desktop, redirect to intermediate page with error
    if (source === "desktop") {
      return NextResponse.redirect(
        `${origin}/auth/desktop-success?error=${errorMsg}`
      );
    }
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("exchangeCodeForSession error:", error.message);
      const errorMsg = encodeURIComponent(error.message);

      // If from desktop, redirect to intermediate page with error
      if (source === "desktop") {
        return NextResponse.redirect(
          `${origin}/auth/desktop-success?error=${errorMsg}`
        );
      }
      return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
    }

    const session = data.session;
    console.log(
      "[auth/callback] provider_token exists:",
      !!session?.provider_token,
    );

    if (session?.provider_token && session.user) {
      try {
        const githubUser = await getGitHubUser(session.provider_token);
        console.log("[auth/callback] GitHub user:", githubUser.login);
        const { error: storeError } = await storeGitHubToken(
          supabase,
          session.user.id,
          githubUser,
          session.provider_token,
          session.provider_refresh_token ? "with_refresh" : undefined,
        );
        if (storeError) {
          console.error(
            "[auth/callback] Failed to store GitHub token:",
            storeError,
          );
        } else {
          console.log("[auth/callback] GitHub token stored successfully");
        }
      } catch (err) {
        console.error("[auth/callback] Failed to fetch GitHub user:", err);
      }
    } else {
      console.log(
        "[auth/callback] No provider_token in session, skipping token storage",
      );
    }

    // If source param is present (from URL), redirect to desktop-success
    if (source === "desktop" && session) {
      const params = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      return NextResponse.redirect(`${origin}/auth/desktop-success?${params}`);
    }

    // Redirect to post-login page which checks sessionStorage for desktop source
    // This handles cases where source param wasn't preserved through OAuth
    return NextResponse.redirect(`${origin}/auth/post-login`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
