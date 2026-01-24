import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  getGitHubUser,
  storeGitHubToken,
  checkStarredRepos,
  updateMembershipFromStars,
} from "@/lib/github/stars";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const session = data.session;
      const user = session.user;

      // Check if we have a provider token (could be GitHub link or login)
      const providerToken = session.provider_token;

      // Try to use the token with GitHub API - works for both:
      // 1. GitHub as primary auth provider
      // 2. GitHub linked to existing email account
      if (providerToken) {
        try {
          // Fetch GitHub user info
          const githubUser = await getGitHubUser(providerToken);

          // Store the GitHub token for future API calls
          await storeGitHubToken(
            supabase,
            user.id,
            githubUser,
            providerToken,
            session.provider_refresh_token ? "with_refresh" : undefined,
          );

          // Check starred repos and update membership
          const starredRepos = await checkStarredRepos(providerToken);
          await updateMembershipFromStars(supabase, user.id, starredRepos);
        } catch (githubError) {
          // Log error but don't block the auth flow
          console.error("GitHub integration error:", githubError);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
