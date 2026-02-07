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
    const { allStarred, eligibleCount } = await checkStarredRepos(
      tokenInfo.accessToken,
    );
    const result = await updateMembershipFromStars(
      supabase,
      user.id,
      allStarred,
      eligibleCount,
    );

    if (result.error) {
      console.error("[refresh-stars] Membership update error:", result.error);
      return NextResponse.json(
        { error: "Failed to update membership", details: result.error },
        { status: 500 },
      );
    }

    const inks = eligibleCount * GITHUB_CONFIG.INKS_PER_STAR;

    return NextResponse.json({
      success: true,
      tier: result.tier,
      inksGranted: result.inksGranted,
      starredRepos: allStarred,
      totalStarCount: eligibleCount,
      inks,
      canDownload: inks >= GITHUB_CONFIG.INKS_TO_DOWNLOAD,
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
