import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  getStoredGitHubToken,
  checkStarredRepos,
  updateMembershipFromStars,
} from "@/lib/github/stars";
import { GITHUB_CONFIG } from "@/lib/github/config";

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
    console.log("[refresh-stars] Checking starred repos...");
    const starredRepos = await checkStarredRepos(tokenInfo.accessToken);
    console.log("[refresh-stars] Found starred repos:", starredRepos.length);

    console.log("[refresh-stars] Updating membership...");
    const result = await updateMembershipFromStars(
      supabase,
      user.id,
      starredRepos,
    );
    console.log("[refresh-stars] Update result:", result);

    if (result.error) {
      console.error("[refresh-stars] Membership update error:", result.error);
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
    const stack = error instanceof Error ? error.stack : "";
    console.error("[refresh-stars] Error:", message, stack);

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
      { error: "Failed to refresh stars", details: message },
      { status: 500 },
    );
  }
}
