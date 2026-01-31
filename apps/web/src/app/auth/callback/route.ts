import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
    const cookieHeader = request.headers.get("cookie") || "";
    console.log("[auth/callback] Cookies:", cookieHeader);
    const authSourceMatch = cookieHeader.match(/auth_source=([^;]+)/);
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
    // For desktop flow, call Supabase Auth API directly to get full tokens
    if (source === "desktop") {
      console.log("[auth/callback] Desktop flow - calling Supabase API directly");

      // Get the code_verifier from cookies (stored by Supabase during OAuth init)
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      console.log("[auth/callback] All cookies:", allCookies.map(c => c.name));

      // Find the code verifier cookie (format: sb-<ref>-auth-token-code-verifier)
      const codeVerifierCookie = allCookies.find(c => c.name.includes("code-verifier"));
      const codeVerifier = codeVerifierCookie?.value;
      console.log("[auth/callback] Code verifier found:", !!codeVerifier, "length:", codeVerifier?.length);

      if (!codeVerifier) {
        console.log("[auth/callback] ERROR: No code verifier found");
        return NextResponse.redirect(`${origin}/auth/desktop-success?error=${encodeURIComponent("Missing code verifier. Please try again.")}`);
      }

      // Call Supabase Auth API directly (bypassing SSR client to get full refresh token)
      // Supabase expects grant_type as URL query param for PKCE flow
      const tokenUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=pkce`;
      console.log("[auth/callback] Calling token endpoint:", tokenUrl);

      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        body: JSON.stringify({
          auth_code: code,
          code_verifier: codeVerifier,
        }),
      });

      const tokenText = await tokenResponse.text();
      console.log("[auth/callback] Token response status:", tokenResponse.status);
      console.log("[auth/callback] Token response body:", tokenText.substring(0, 500));

      let tokenData;
      try {
        tokenData = JSON.parse(tokenText);
      } catch {
        console.log("[auth/callback] Failed to parse token response");
        return NextResponse.redirect(`${origin}/auth/desktop-success?error=${encodeURIComponent("Invalid response from auth server")}`);
      }

      console.log("[auth/callback] Token response has access_token:", !!tokenData.access_token);
      console.log("[auth/callback] Token response has refresh_token:", !!tokenData.refresh_token);
      console.log("[auth/callback] refresh_token length:", tokenData.refresh_token?.length);

      if (!tokenResponse.ok || !tokenData.access_token) {
        const errorMsg = tokenData.error_description || tokenData.msg || tokenData.error || "Failed to get tokens";
        console.log("[auth/callback] Token error:", errorMsg);
        return NextResponse.redirect(`${origin}/auth/desktop-success?error=${encodeURIComponent(errorMsg)}`);
      }

      // Redirect to desktop-success with full tokens
      const params = new URLSearchParams({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      });

      const response = NextResponse.redirect(`${origin}/auth/desktop-success?${params}`);
      response.cookies.set("auth_source", "", { path: "/", maxAge: 0 });
      // Clear the code verifier cookie
      if (codeVerifierCookie) {
        response.cookies.set(codeVerifierCookie.name, "", { path: "/", maxAge: 0 });
      }
      return response;
    }

    // For non-desktop flow, use SSR client (stores session in cookies)
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorMsg = encodeURIComponent(error.message);
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

    console.log("[auth/callback] Non-desktop flow - redirecting to post-login");
    // For non-desktop, redirect to post-login page
    return NextResponse.redirect(`${origin}/auth/post-login`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
