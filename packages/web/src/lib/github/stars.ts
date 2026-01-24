import { GITHUB_CONFIG, calculateMembership, type StarredRepo } from "./config";
import type { SupabaseClient } from "@supabase/supabase-js";

const GITHUB_API_BASE = "https://api.github.com";

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

/**
 * Fetch GitHub user profile using access token
 */
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch(`${GITHUB_API_BASE}/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Check if user has starred a specific repository
 */
async function checkRepoStarred(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<boolean> {
  const response = await fetch(
    `${GITHUB_API_BASE}/user/starred/${owner}/${repo}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );

  // 204 = starred, 404 = not starred
  return response.status === 204;
}

/**
 * Get starred timestamp for a repository (if starred)
 */
async function getRepoStarredAt(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<string | null> {
  // Use the star timestamps endpoint
  const response = await fetch(
    `${GITHUB_API_BASE}/user/starred/${owner}/${repo}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.star+json", // Returns star_created_at
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    // If we can't get the timestamp, just check if starred
    const isStarred = await checkRepoStarred(accessToken, owner, repo);
    return isStarred ? new Date().toISOString() : null;
  }

  const data = await response.json();
  return data.starred_at || new Date().toISOString();
}

/**
 * Check which LMMs-Lab repos the user has starred
 * Returns array of starred repo info with timestamps
 */
export async function checkStarredRepos(
  accessToken: string,
): Promise<StarredRepo[]> {
  const starredRepos: StarredRepo[] = [];

  // Check each eligible repo in parallel
  const checks = GITHUB_CONFIG.ELIGIBLE_REPOS.map(async (repo) => {
    const starredAt = await getRepoStarredAt(
      accessToken,
      GITHUB_CONFIG.ORG,
      repo,
    );

    if (starredAt) {
      return {
        repo: `${GITHUB_CONFIG.ORG}/${repo}`,
        starred_at: starredAt,
      };
    }
    return null;
  });

  const results = await Promise.all(checks);

  for (const result of results) {
    if (result) {
      starredRepos.push(result);
    }
  }

  return starredRepos;
}

/**
 * Update user's membership in the database based on their starred repos
 */
export async function updateMembershipFromStars(
  supabase: SupabaseClient,
  userId: string,
  starredRepos: StarredRepo[],
): Promise<{ tier: string; daysGranted: number; error?: string }> {
  const starCount = starredRepos.length;
  const { tier, daysGranted } = calculateMembership(starCount);

  // Call the database function to update membership
  const { error } = await supabase.rpc("update_membership_from_stars", {
    p_user_id: userId,
    p_starred_repos: starredRepos,
    p_star_count: starCount,
  });

  if (error) {
    return { tier, daysGranted, error: error.message };
  }

  return { tier, daysGranted };
}

/**
 * Store or update GitHub token info in database
 */
export async function storeGitHubToken(
  supabase: SupabaseClient,
  userId: string,
  githubUser: GitHubUser,
  accessToken: string,
  tokenScope?: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.from("user_github_tokens").upsert({
    user_id: userId,
    github_id: githubUser.id,
    github_username: githubUser.login,
    github_avatar_url: githubUser.avatar_url,
    access_token: accessToken,
    token_scope: tokenScope,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Get user's GitHub token from database
 */
export async function getStoredGitHubToken(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ accessToken: string; username: string } | null> {
  const { data, error } = await supabase
    .from("user_github_tokens")
    .select("access_token, github_username")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    accessToken: data.access_token,
    username: data.github_username,
  };
}

/**
 * Get user's membership info from database
 */
export async function getMembershipInfo(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  tier: string;
  expiresAt: string | null;
  starredRepos: StarredRepo[];
  totalStarCount: number;
  lastStarCheck: string | null;
} | null> {
  const { data, error } = await supabase
    .from("user_memberships")
    .select(
      "tier, expires_at, starred_repos, total_star_count, last_star_check",
    )
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    tier: data.tier,
    expiresAt: data.expires_at,
    starredRepos: data.starred_repos || [],
    totalStarCount: data.total_star_count,
    lastStarCheck: data.last_star_check,
  };
}
