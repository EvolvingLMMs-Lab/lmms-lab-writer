import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  getStoredGitHubToken,
  checkStarredRepos,
  updateMembershipFromStars,
  getMembershipInfo,
} from "@/lib/github/stars";
import { GITHUB_CONFIG } from "@/lib/github/config";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembershipInfo(supabase, user.id);

  if (!membership) {
    return NextResponse.json({
      tier: "free",
      starredRepos: [],
      totalStarCount: 0,
      credits: 0,
      canDownload: false,
      lastStarCheck: null,
    });
  }

  const credits = membership.totalStarCount * GITHUB_CONFIG.CREDITS_PER_STAR;

  return NextResponse.json({
    tier: membership.tier,
    starredRepos: membership.starredRepos,
    totalStarCount: membership.totalStarCount,
    credits,
    canDownload: credits >= GITHUB_CONFIG.CREDITS_TO_DOWNLOAD,
    lastStarCheck: membership.lastStarCheck,
  });
}

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const starredRepos = await checkStarredRepos(tokenInfo.accessToken);

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

    const credits = starredRepos.length * GITHUB_CONFIG.CREDITS_PER_STAR;

    return NextResponse.json({
      success: true,
      tier: result.tier,
      creditsGranted: result.creditsGranted,
      starredRepos,
      totalStarCount: starredRepos.length,
      credits,
      canDownload: credits >= GITHUB_CONFIG.CREDITS_TO_DOWNLOAD,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

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
