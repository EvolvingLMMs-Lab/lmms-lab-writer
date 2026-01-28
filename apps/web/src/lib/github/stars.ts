import {
  GITHUB_CONFIG,
  calculateMembership,
  getTopRepos,
  type StarredRepo,
} from "./config";
import type { SupabaseClient } from "@supabase/supabase-js";

const GITHUB_API_BASE = "https://api.github.com";

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

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

  return response.status === 204;
}

async function getRepoStarredAt(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<string | null> {
  const response = await fetch(
    `${GITHUB_API_BASE}/user/starred/${owner}/${repo}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.star+json",
      },
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (response.status === 204) {
    return new Date().toISOString();
  }

  if (!response.ok) {
    const isStarred = await checkRepoStarred(accessToken, owner, repo);
    return isStarred ? new Date().toISOString() : null;
  }

  const text = await response.text();
  if (!text) {
    return new Date().toISOString();
  }

  try {
    const data = JSON.parse(text);
    return data.starred_at || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export async function checkStarredRepos(
  accessToken: string,
): Promise<StarredRepo[]> {
  const topRepos = await getTopRepos();
  const starredRepos: StarredRepo[] = [];

  const checks = topRepos.map(async (repo) => {
    const starredAt = await getRepoStarredAt(
      accessToken,
      GITHUB_CONFIG.ORG,
      repo.name,
    );

    if (starredAt) {
      return {
        repo: repo.name,
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

export async function updateMembershipFromStars(
  supabase: SupabaseClient,
  userId: string,
  starredRepos: StarredRepo[],
): Promise<{ tier: string; inksGranted: number; error?: string }> {
  const starCount = starredRepos.length;
  const { tier, inksGranted } = calculateMembership(starCount);

  const { error } = await supabase.rpc("update_membership_from_stars", {
    p_user_id: userId,
    p_starred_repos: starredRepos,
    p_star_count: starCount,
  });

  if (error) {
    return { tier, inksGranted, error: error.message };
  }

  return { tier, inksGranted };
}

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
