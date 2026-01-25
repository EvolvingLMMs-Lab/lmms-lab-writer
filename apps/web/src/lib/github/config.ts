export const GITHUB_CONFIG = {
  ORG: "EvolvingLMMs-Lab",
  MAX_ELIGIBLE_REPOS: 5, // Top N repos counted for membership
  MIN_STARS_TO_SHOW: 100, // Minimum stars to show in suggested repos
  DAYS_PER_STAR: 7,
  MAX_STARS: 5,
  MAX_DAYS: 35,
} as const;

export type RepoInfo = {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
};

/**
 * Fetch all repos from GitHub API (handles pagination)
 */
async function fetchAllOrgRepos(): Promise<RepoInfo[]> {
  const allRepos: RepoInfo[] = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const response = await fetch(
        `https://api.github.com/orgs/${GITHUB_CONFIG.ORG}/repos?per_page=${perPage}&page=${page}&sort=stars&direction=desc`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            ...(process.env.GITHUB_TOKEN && {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            }),
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        console.error(
          `[fetchAllOrgRepos] GitHub API error: ${response.status} ${response.statusText}`,
        );
        break;
      }

      const repos = await response.json();
      if (repos.length === 0) break;

      const mapped = repos
        .filter((repo: { private: boolean }) => !repo.private)
        .map(
          (repo: {
            name: string;
            full_name: string;
            description: string | null;
            stargazers_count: number;
            html_url: string;
          }) => ({
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description,
            stargazers_count: repo.stargazers_count,
            html_url: repo.html_url,
          }),
        );

      allRepos.push(...mapped);

      // Stop if we got less than a full page
      if (repos.length < perPage) break;
      page++;
    }

    // Sort by stars descending
    return allRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } catch {
    return allRepos;
  }
}

/**
 * Fetch top repos by stars (used for membership calculation)
 */
export async function getTopRepos(): Promise<RepoInfo[]> {
  const allRepos = await fetchAllOrgRepos();
  return allRepos.slice(0, GITHUB_CONFIG.MAX_ELIGIBLE_REPOS);
}

/**
 * Fetch all repos with > MIN_STARS_TO_SHOW stars (for display)
 */
export async function getAllPopularRepos(): Promise<RepoInfo[]> {
  const allRepos = await fetchAllOrgRepos();
  return allRepos.filter(
    (repo) => repo.stargazers_count >= GITHUB_CONFIG.MIN_STARS_TO_SHOW,
  );
}

export type MembershipTier = "free" | "supporter";

export interface StarredRepo {
  repo: string;
  starred_at: string;
}

export interface MembershipInfo {
  tier: MembershipTier;
  expiresAt: Date | null;
  starredRepos: StarredRepo[];
  totalStarCount: number;
  daysRemaining: number | null;
}

export function calculateMembership(starCount: number): {
  tier: MembershipTier;
  daysGranted: number;
} {
  if (starCount >= 1) {
    const effectiveStars = Math.min(starCount, GITHUB_CONFIG.MAX_STARS);
    const days = Math.min(
      effectiveStars * GITHUB_CONFIG.DAYS_PER_STAR,
      GITHUB_CONFIG.MAX_DAYS,
    );
    return { tier: "supporter", daysGranted: days };
  }
  return { tier: "free", daysGranted: 0 };
}

export function getDaysRemaining(expiresAt: Date | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
