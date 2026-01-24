import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  getStoredGitHubToken,
  checkStarredRepos,
  updateMembershipFromStars,
} from "@/lib/github/stars";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Try to get stored token first
  let accessToken: string | null = null;

  const storedToken = await getStoredGitHubToken(supabase, userId);
  if (storedToken) {
    accessToken = storedToken.accessToken;
  } else if (session.provider_token) {
    // Fall back to session token for GitHub auth users
    accessToken = session.provider_token;
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "No GitHub token available" },
      { status: 400 }
    );
  }

  try {
    // Check starred repos
    const starredRepos = await checkStarredRepos(accessToken);

    // Update membership
    const result = await updateMembershipFromStars(
      supabase,
      userId,
      starredRepos
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      starCount: starredRepos.length,
      tier: result.tier,
      daysGranted: result.daysGranted,
    });
  } catch (error) {
    console.error("Failed to refresh stars:", error);
    return NextResponse.json(
      { error: "Failed to check GitHub stars" },
      { status: 500 }
    );
  }
}
