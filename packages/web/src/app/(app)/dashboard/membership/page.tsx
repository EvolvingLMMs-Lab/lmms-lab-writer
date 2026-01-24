import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  GITHUB_CONFIG,
  getDaysRemaining,
  MembershipTier,
  StarredRepo,
} from "@/lib/github/config";
import { GitHubLoginButton } from "@/components/auth/github-login-button";

type RepoInfo = {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
};

async function getRepoInfo(): Promise<RepoInfo[]> {
  try {
    // Fetch top public repos from org directly (sorted by stars)
    const response = await fetch(
      `https://api.github.com/orgs/${GITHUB_CONFIG.ORG}/repos?per_page=20&sort=stars&direction=desc`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      return [];
    }

    const repos = await response.json();

    // Filter public repos and take top 5
    return repos
      .filter((repo: { private: boolean }) => !repo.private)
      .slice(0, 5)
      .map((repo: { name: string; full_name: string; description: string | null; stargazers_count: number; html_url: string }) => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        stargazers_count: repo.stargazers_count,
        html_url: repo.html_url,
      }));
  } catch {
    return [];
  }
}

function formatStarCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export default async function MembershipPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  // Fetch repo info and membership data in parallel
  const [repoInfo, { data: membership }, { data: githubToken }] =
    await Promise.all([
      getRepoInfo(),
      supabase
        .from("user_memberships")
        .select("*")
        .eq("user_id", session.user.id)
        .single(),
      supabase
        .from("user_github_tokens")
        .select("id")
        .eq("user_id", session.user.id)
        .single(),
    ]);

  const tier: MembershipTier = membership?.tier || "free";
  const expiresAt = membership?.expires_at
    ? new Date(membership.expires_at)
    : null;
  const daysRemaining = getDaysRemaining(expiresAt);
  const starredRepos: StarredRepo[] =
    (membership?.starred_repos as unknown as StarredRepo[]) || [];
  const totalStars = membership?.total_star_count || 0;

  const isGitHubConnected = !!githubToken;
  const starredRepoNames = new Set(starredRepos.map((r) => r.repo));

  // Progress calculation
  const maxStars = GITHUB_CONFIG.ELIGIBLE_REPOS.length;
  const progressPercent = Math.min((totalStars / maxStars) * 100, 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - matches main site */}
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
            href="/dashboard"
            className="text-sm text-muted hover:text-black transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Page Title */}
        <h1 className="text-3xl font-light tracking-tight mb-8">Membership</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Status Card */}
          <div className="lg:col-span-1">
            <div className="border border-border bg-white p-6 sticky top-6">
              <div className="flex justify-center mb-4">
                {tier === "supporter" ? (
                  <div className="size-16 border-2 border-black bg-black text-white flex items-center justify-center">
                    <svg
                      className="size-8"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                ) : (
                  <div className="size-16 border-2 border-neutral-300 flex items-center justify-center">
                    <svg
                      className="size-8 text-neutral-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-light text-center mb-1">
                {tier === "supporter" ? "Supporter" : "Free"}
              </h2>

              {tier === "supporter" && daysRemaining !== null && (
                <p className="text-sm text-muted text-center mb-4">
                  {daysRemaining > 0
                    ? `${daysRemaining} days remaining`
                    : "Expired"}
                </p>
              )}

              {tier === "free" && (
                <p className="text-sm text-muted text-center mb-4">
                  Star repos to unlock benefits
                </p>
              )}

              {/* Progress */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted">Progress</span>
                  <span className="font-mono">
                    {totalStars}/{maxStars}
                  </span>
                </div>
                <div className="h-1.5 bg-neutral-100 border border-neutral-200">
                  <div
                    className="h-full bg-black transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* GitHub Connection */}
            {!isGitHubConnected && (
              <div className="border-2 border-dashed border-neutral-300 p-8 text-center">
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

            {/* Repositories to Star */}
            <div>
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted mb-4">
                Eligible Repositories
              </h2>

              <div className="space-y-2">
                {repoInfo.map((repo) => {
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
                          className="px-4 py-1.5 bg-black text-white text-xs font-mono uppercase tracking-wider hover:bg-neutral-800 transition-colors ml-4 flex-shrink-0"
                        >
                          Star
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border pt-8">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted mb-4">
                How It Works
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="size-10 border border-black flex items-center justify-center mb-3 font-mono font-bold">
                    1
                  </div>
                  <h3 className="font-medium mb-1">Star</h3>
                  <p className="text-sm text-muted">
                    Star any of our repos on GitHub.
                  </p>
                </div>
                <div>
                  <div className="size-10 border border-black flex items-center justify-center mb-3 font-mono font-bold">
                    2
                  </div>
                  <h3 className="font-medium mb-1">Earn</h3>
                  <p className="text-sm text-muted">
                    Each star = +{GITHUB_CONFIG.DAYS_PER_STAR} days membership.
                  </p>
                </div>
                <div>
                  <div className="size-10 border border-black flex items-center justify-center mb-3 font-mono font-bold">
                    3
                  </div>
                  <h3 className="font-medium mb-1">Max</h3>
                  <p className="text-sm text-muted">
                    Up to {GITHUB_CONFIG.MAX_DAYS} days with{" "}
                    {GITHUB_CONFIG.MAX_STARS} stars.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
