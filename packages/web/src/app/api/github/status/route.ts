import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getMembershipInfo } from "@/lib/github/stars";
import { getDaysRemaining } from "@/lib/github/config";

interface GitHubTokenRecord {
  github_username: string;
  github_avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/github/status
 * Returns whether user has connected GitHub, their username, and current membership
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has connected GitHub
    const { data: tokenRecord, error: tokenError } = await supabase
      .from("user_github_tokens")
      .select("github_username, github_avatar_url, created_at, updated_at")
      .eq("user_id", user.id)
      .single();

    const githubConnected = !tokenError && !!tokenRecord;
    const typedTokenRecord = tokenRecord as GitHubTokenRecord | null;

    // Get membership info (null if user has no membership record yet)
    let membership = null;
    try {
      membership = await getMembershipInfo(supabase, user.id);
    } catch (membershipError) {
      console.error(
        "[github/status] Error fetching membership:",
        membershipError,
      );
      // Continue with null membership - don't fail the whole request
    }

    return NextResponse.json({
      // GitHub connection status
      connected: githubConnected,
      username: typedTokenRecord?.github_username || null,
      avatarUrl: typedTokenRecord?.github_avatar_url || null,
      connectedAt: typedTokenRecord?.created_at || null,

      // Membership info
      membership: membership
        ? {
            tier: membership.tier,
            expiresAt: membership.expiresAt,
            daysRemaining: membership.expiresAt
              ? getDaysRemaining(new Date(membership.expiresAt))
              : null,
            starredRepos: membership.starredRepos,
            totalStarCount: membership.totalStarCount,
            lastStarCheck: membership.lastStarCheck,
          }
        : {
            tier: "free",
            expiresAt: null,
            daysRemaining: null,
            starredRepos: [],
            totalStarCount: 0,
            lastStarCheck: null,
          },
    });
  } catch (error) {
    console.error("[github/status] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
