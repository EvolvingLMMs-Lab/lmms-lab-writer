import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  getStoredGitHubToken,
  checkStarredRepos,
  updateMembershipFromStars,
  getMembershipInfo,
} from "@/lib/github/stars";
import { getDaysRemaining } from "@/lib/github/config";

/**
 * GET /api/github/check-stars
 * Returns current membership info without refreshing from GitHub
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current membership info from database
  const membership = await getMembershipInfo(supabase, user.id);

  if (!membership) {
    return NextResponse.json({
      tier: "free",
      expiresAt: null,
      starredRepos: [],
      totalStarCount: 0,
      daysRemaining: null,
      lastStarCheck: null,
    });
  }

  return NextResponse.json({
    tier: membership.tier,
    expiresAt: membership.expiresAt,
    starredRepos: membership.starredRepos,
    totalStarCount: membership.totalStarCount,
    daysRemaining: membership.expiresAt
      ? getDaysRemaining(new Date(membership.expiresAt))
      : null,
    lastStarCheck: membership.lastStarCheck,
  });
}

/**
 * POST /api/github/check-stars
 * Force refresh stars from GitHub API and update membership
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get stored GitHub token
  const tokenInfo = await getStoredGitHubToken(supabase, user.id);
  if (!tokenInfo) {
    return NextResponse.json(
      {
        error: "GitHub not connected",
        message: "Please connect your GitHub account first",
      },
      { status: 400 },
    );
  }

  try {
    // Fetch starred repos from GitHub API
    const starredRepos = await checkStarredRepos(tokenInfo.accessToken);

    // Update membership in database
    const result = await updateMembershipFromStars(
      supabase,
      user.id,
      starredRepos,
    );

    if (result.error) {
      return NextResponse.json(
        { error: "Failed to update membership", details: result.error },
        { status: 500 },
      );
    }

    // Get updated membership info
    const membership = await getMembershipInfo(supabase, user.id);

    return NextResponse.json({
      success: true,
      tier: result.tier,
      daysGranted: result.daysGranted,
      starredRepos,
      totalStarCount: starredRepos.length,
      expiresAt: membership?.expiresAt || null,
      daysRemaining: membership?.expiresAt
        ? getDaysRemaining(new Date(membership.expiresAt))
        : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Check if token is invalid/expired
    if (message.includes("401")) {
      return NextResponse.json(
        {
          error: "GitHub token expired",
          message: "Please reconnect your GitHub account",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Failed to check GitHub stars", details: message },
      { status: 500 },
    );
  }
}
