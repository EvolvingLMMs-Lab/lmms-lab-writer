export const GITHUB_CONFIG = {
  ORG: "EvolvingLMMs-Lab",
  ELIGIBLE_REPOS: [
    "agentic-latex-writer",
    "lmms-eval",
    "lmms-finetune",
    "lmms-lab.github.io",
  ],
  DAYS_PER_STAR: 7,
  MAX_STARS: 4,
  MAX_DAYS: 30,
} as const;

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
