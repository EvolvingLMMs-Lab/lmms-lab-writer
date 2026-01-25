export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import {
  getDaysRemaining,
  MembershipTier,
  StarredRepo,
  GITHUB_CONFIG,
  getAllPopularRepos,
  type RepoInfo,
} from "@/lib/github/config";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GitHubLoginButton } from "@/components/auth/github-login-button";
import { RefreshStarsButton } from "@/components/auth/refresh-stars-button";

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: string | null;
  createdAt: string;
  lastSignIn: string | null;
};

type UserStats = {
  documentsOwned: number;
  documentsShared: number;
};

type MembershipData = {
  tier: MembershipTier;
  daysRemaining: number | null;
  expiresAt: Date | null;
  totalStars: number;
  starredRepos: StarredRepo[];
};

function formatStarCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

async function getProfileData(): Promise<{
  profile: UserProfile;
  stats: UserStats;
  membership: MembershipData;
  isGitHubConnected: boolean;
  repos: RepoInfo[];
}> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  const metadata = user.user_metadata || {};

  const profile: UserProfile = {
    id: user.id,
    email: user.email ?? "",
    name: metadata.full_name || metadata.name || metadata.user_name || null,
    avatarUrl: metadata.avatar_url || metadata.picture || null,
    provider: user.app_metadata?.provider || null,
    createdAt: user.created_at,
    lastSignIn: user.last_sign_in_at || null,
  };

  const [membershipResult, githubTokenResult, repos] = await Promise.all([
    supabase
      .from("user_memberships")
      .select("tier, expires_at, total_star_count, starred_repos")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("user_github_tokens")
      .select("id")
      .eq("user_id", user.id)
      .single(),
    getAllPopularRepos(),
  ]);

  const stats: UserStats = {
    documentsOwned: 0,
    documentsShared: 0,
  };

  const membershipData = membershipResult.data;
  const expiresAt = membershipData?.expires_at
    ? new Date(membershipData.expires_at)
    : null;

  const membership: MembershipData = {
    tier: (membershipData?.tier as MembershipTier) || "free",
    daysRemaining: getDaysRemaining(expiresAt),
    expiresAt,
    totalStars: membershipData?.total_star_count || 0,
    starredRepos:
      (membershipData?.starred_repos as unknown as StarredRepo[]) || [],
  };

  const isGitHubConnected =
    profile.provider === "github" || !!githubTokenResult.data;

  return {
    profile,
    stats,
    membership,
    isGitHubConnected,
    repos,
  };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRelativeDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function ProfilePage() {
  const { profile, membership, isGitHubConnected, repos } =
    await getProfileData();
  const displayName = profile.name || profile.email.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  const starredRepoNames = new Set(membership.starredRepos.map((r) => r.repo));
  const maxStars = GITHUB_CONFIG.MAX_ELIGIBLE_REPOS;
  const progressPercent = Math.min(
    (membership.totalStars / maxStars) * 100,
    100,
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight uppercase flex items-center gap-3"
          >
            <div className="logo-bar text-foreground">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            LMMs-Lab Writer
          </Link>
          <Link
            href="/"
            className="text-sm text-muted hover:text-black transition-colors flex items-center gap-1.5"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-light tracking-tight mb-8">Profile</h1>

        <div className="border border-border p-6 mb-8">
          <div className="flex items-center gap-6">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="size-16 border border-border flex-shrink-0"
              />
            ) : (
              <div className="size-16 border border-border bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-light text-neutral-600">
                  {initial}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-lg font-medium truncate">{displayName}</p>
              <p className="text-sm text-muted truncate">{profile.email}</p>
              <p className="text-sm text-muted mt-1">
                Joined {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="border border-border mb-8">
          <div className="px-6 py-4 border-b border-border bg-neutral-50">
            <h2 className="text-sm font-mono uppercase tracking-wider">
              Connected Accounts
            </h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-3">
              {profile.provider === "github" ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 border border-black bg-neutral-50">
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span className="text-sm font-medium">GitHub</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 border border-black bg-neutral-50">
                  <svg
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Email</span>
                </div>
              )}

              {isGitHubConnected && profile.provider !== "github" && (
                <div className="inline-flex items-center gap-2 px-4 py-2 border border-black bg-neutral-50">
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span className="text-sm font-medium">GitHub</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <a
            href="#suggested-repos"
            className="border border-border p-6 hover:border-black transition-colors group block"
          >
            <p className="text-3xl font-light tabular-nums mb-1">
              {membership.totalStars}
              <span className="text-sm text-muted font-normal">
                /{maxStars}
              </span>
            </p>
            <p className="text-sm text-muted group-hover:text-black transition-colors">
              <span
                className={`font-mono uppercase px-1.5 py-0.5 mr-1.5 ${
                  membership.tier === "supporter"
                    ? "bg-black text-white"
                    : "border border-neutral-300"
                }`}
              >
                {membership.tier}
              </span>
              {membership.tier === "supporter" && membership.daysRemaining
                ? `${membership.daysRemaining}d left`
                : "Stars"}
            </p>
          </a>
        </div>

        <div className="border border-border mb-8">
          <div className="px-6 py-4 border-b border-border bg-neutral-50">
            <h2 className="text-sm font-mono uppercase tracking-wider">
              Account Details
            </h2>
          </div>
          <div className="divide-y divide-border">
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-muted">User ID</span>
              <code className="text-sm font-mono bg-neutral-100 px-2 py-1">
                {profile.id.slice(0, 8)}
              </code>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-muted">Email</span>
              <span className="text-sm">{profile.email}</span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-muted">Registered</span>
              <span className="text-sm">{formatDate(profile.createdAt)}</span>
            </div>
            {membership.expiresAt && (
              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-sm text-muted">Membership Expires</span>
                <span className="text-sm">
                  {membership.expiresAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {membership.daysRemaining !== null && (
                    <span className="text-muted ml-2">
                      ({membership.daysRemaining}d left)
                    </span>
                  )}
                </span>
              </div>
            )}
            {profile.lastSignIn && (
              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-sm text-muted">Last Sign In</span>
                <span className="text-sm">
                  {formatRelativeDate(profile.lastSignIn)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div id="suggested-repos" className="border border-border scroll-mt-6">
          <div className="px-6 py-4 border-b border-border bg-neutral-50 flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-wider">
              Suggested Repos
            </h2>
            <div className="flex items-center gap-4">
              {isGitHubConnected && <RefreshStarsButton />}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted font-mono">
                  {membership.totalStars}/{maxStars}
                </span>
                <div className="w-24 h-1.5 bg-neutral-100 border border-neutral-200">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {!isGitHubConnected && (
              <div className="border-2 border-dashed border-neutral-300 p-8 text-center mb-6">
                <svg
                  className="size-10 mx-auto mb-4 text-neutral-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Connect GitHub</h3>
                <p className="text-sm text-muted mb-6 max-w-sm mx-auto">
                  Link your GitHub account to track stars and unlock membership.
                </p>
                <GitHubLoginButton />
              </div>
            )}

            <div className="space-y-2 mb-8 max-h-[400px] overflow-y-auto pr-2">
              {repos.map((repo) => {
                const isStarred = starredRepoNames.has(repo.name);

                return (
                  <div
                    key={repo.name}
                    className={`flex items-center justify-between p-4 border transition-colors ${
                      isStarred
                        ? "border-black bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {isStarred ? (
                        <svg
                          className="size-5 text-black flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ) : (
                        <svg
                          className="size-5 text-neutral-400 flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      )}
                      <div className="min-w-0 flex-1">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm hover:underline block truncate"
                        >
                          {repo.name}
                        </a>
                        {repo.description && (
                          <p className="text-xs text-muted truncate mt-0.5">
                            {repo.description}
                          </p>
                        )}
                      </div>
                      {repo.stargazers_count > 0 && (
                        <span className="text-xs text-muted font-mono tabular-nums flex-shrink-0">
                          {formatStarCount(repo.stargazers_count)}
                        </span>
                      )}
                    </div>

                    {isStarred ? (
                      <span className="text-xs font-mono uppercase tracking-wider text-muted ml-4 flex-shrink-0">
                        +7 days
                      </span>
                    ) : (
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-1.5 border border-black text-xs font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors ml-4 flex-shrink-0"
                      >
                        Star
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-sm text-muted text-center pt-4 border-t border-border">
              Star a repo = {GITHUB_CONFIG.DAYS_PER_STAR} days membership | Max{" "}
              {GITHUB_CONFIG.MAX_DAYS} days
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
