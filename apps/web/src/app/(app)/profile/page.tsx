import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import {
  MembershipTier,
  StarredRepo,
  GITHUB_CONFIG,
  getAllPopularRepos,
  getTopRepos,
  canDownload,
  type RepoInfo,
} from "@/lib/github/config";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GitHubLoginButton } from "@/components/auth/github-login-button";
import { RefreshStarsButton } from "@/components/auth/refresh-stars-button";
import {
  ProfileCard,
  ProfileSection,
  ProfileTitle,
  RepoList,
  RepoItem,
} from "@/components/profile-sections";
import { InkDropAnimation } from "@/components/ink-drop-animation";

function formatStarCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
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

function ProfileCardSkeleton() {
  return (
    <div className="border border-border p-6 mb-8 animate-pulse">
      <div className="flex items-center gap-6">
        <div className="size-16 bg-neutral-100" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-neutral-100 mb-2" />
          <div className="h-4 w-48 bg-neutral-50 mb-1" />
          <div className="h-4 w-36 bg-neutral-50" />
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton({ title }: { title: string }) {
  return (
    <div className="border border-border mb-8 animate-pulse">
      <div className="px-6 py-4 border-b border-border bg-neutral-50">
        <div className="h-4 w-32 bg-neutral-200" />
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-full bg-neutral-50" />
          ))}
        </div>
      </div>
    </div>
  );
}

function MembershipSkeleton() {
  return (
    <div className="border border-border p-6 mb-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-neutral-100 mb-2" />
          <div className="h-4 w-48 bg-neutral-50" />
        </div>
        <div className="h-4 w-16 bg-neutral-50" />
      </div>
    </div>
  );
}

function ReposSkeleton() {
  return (
    <div className="border border-border mb-8 animate-pulse">
      <div className="px-6 py-4 border-b border-border bg-neutral-50 flex items-center justify-between">
        <div className="h-4 w-32 bg-neutral-200" />
        <div className="h-4 w-24 bg-neutral-100" />
      </div>
      <div className="p-6">
        <div className="space-y-2 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 w-full bg-neutral-50" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function ProfileUserCard() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const user = session.user;
  const metadata = user.user_metadata || {};
  const email = user.email ?? "";
  const name =
    metadata.full_name || metadata.name || metadata.user_name || null;
  const avatarUrl = metadata.avatar_url || metadata.picture || null;
  const displayName = name || email.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <ProfileCard delay={0.05} className="border border-border p-6 mb-8">
      <div className="flex items-center gap-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
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
          <p className="text-sm text-muted truncate">{email}</p>
          <p className="text-sm text-muted mt-1">
            Joined {formatDate(user.created_at)}
          </p>
        </div>
      </div>
    </ProfileCard>
  );
}

async function ConnectedAccountsSection() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const user = session.user;
  const provider = user.app_metadata?.provider || null;

  const { data: githubToken } = await supabase
    .from("user_github_tokens")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const isGitHubConnected = provider === "github" || !!githubToken;

  return (
    <ProfileSection delay={0.1} className="border border-border mb-8">
      <div className="px-6 py-4 border-b border-border bg-neutral-50">
        <h2 className="text-sm font-mono uppercase tracking-wider">
          Connected Accounts
        </h2>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-3">
          {provider === "github" ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-black bg-neutral-50">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
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

          {isGitHubConnected && provider !== "github" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-black bg-neutral-50">
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="text-sm font-medium">GitHub</span>
            </div>
          )}
        </div>
      </div>
    </ProfileSection>
  );
}

async function InksSection() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: membershipData } = await supabase
    .from("user_memberships")
    .select("tier, total_star_count")
    .eq("user_id", session.user.id)
    .single();

  const totalStars = membershipData?.total_star_count || 0;
  const inks = totalStars * GITHUB_CONFIG.INKS_PER_STAR;
  const requiredInks = GITHUB_CONFIG.INKS_TO_DOWNLOAD;
  const hasEnoughInks = canDownload(inks);

  return (
    <ProfileSection delay={0.15} className="border border-border mb-8">
      <div className="px-6 py-4 border-b border-border bg-neutral-50 flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-wider">Inks</h2>
        <span className="text-xs font-mono text-muted uppercase tracking-wider">
          Beta - Inks never expire
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-3xl font-light tabular-nums mb-1">
              {inks}
              <span className="text-sm text-muted font-normal ml-2">inks</span>
            </p>
            {hasEnoughInks ? (
              <p className="text-sm text-muted">Ready to download</p>
            ) : (
              <p className="text-sm text-muted">
                {requiredInks - inks} more inks to unlock download
              </p>
            )}
          </div>
          {hasEnoughInks ? (
            <Link
              href="/download"
              className="px-4 py-2 border border-black text-sm font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors"
            >
              Download
            </Link>
          ) : (
            <a
              href="#earn-inks"
              className="text-sm text-muted hover:text-black transition-colors"
            >
              Earn inks →
            </a>
          )}
        </div>
        <p className="text-xs text-muted">
          Star top {GITHUB_CONFIG.MAX_ELIGIBLE_REPOS} repos to earn inks. Need{" "}
          {requiredInks} inks to download.
        </p>
      </div>
    </ProfileSection>
  );
}

async function InkDropAnimationWrapper() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data: membershipData } = await supabase
    .from("user_memberships")
    .select("total_star_count")
    .eq("user_id", session.user.id)
    .single();

  const totalStars = membershipData?.total_star_count || 0;
  const inks = totalStars * GITHUB_CONFIG.INKS_PER_STAR;

  return <InkDropAnimation inks={inks} />;
}

async function AccountDetailsSection() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const user = session.user;

  return (
    <ProfileSection delay={0.2} className="border border-border mb-8">
      <div className="px-6 py-4 border-b border-border bg-neutral-50">
        <h2 className="text-sm font-mono uppercase tracking-wider">
          Account Details
        </h2>
      </div>
      <div className="divide-y divide-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-muted">User ID</span>
          <code className="text-sm font-mono bg-neutral-100 px-2 py-1">
            {user.id.slice(0, 8)}
          </code>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-muted">Email</span>
          <span className="text-sm">{user.email}</span>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-muted">Registered</span>
          <span className="text-sm">{formatDate(user.created_at)}</span>
        </div>
        {user.last_sign_in_at && (
          <div className="px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-muted">Last Sign In</span>
            <span className="text-sm">
              {formatRelativeDate(user.last_sign_in_at)}
            </span>
          </div>
        )}
      </div>
    </ProfileSection>
  );
}

async function SuggestedReposSection() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const user = session.user;
  const provider = user.app_metadata?.provider || null;

  const [membershipResult, githubTokenResult, allRepos, topRepos] =
    await Promise.all([
      supabase
        .from("user_memberships")
        .select("total_star_count, starred_repos")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("user_github_tokens")
        .select("id")
        .eq("user_id", user.id)
        .single(),
      getAllPopularRepos(),
      getTopRepos(),
    ]);

  const isGitHubConnected = provider === "github" || !!githubTokenResult.data;
  const totalStars = membershipResult.data?.total_star_count || 0;
  const starredRepos =
    (membershipResult.data?.starred_repos as unknown as StarredRepo[]) || [];
  const starredRepoNames = new Set(starredRepos.map((r) => r.repo));
  const eligibleRepoNames = new Set(topRepos.map((r) => r.name));

  const inks = totalStars * GITHUB_CONFIG.INKS_PER_STAR;

  return (
    <ProfileSection
      delay={0.25}
      className="border border-border scroll-mt-6"
      id="earn-inks"
    >
      <div className="px-6 py-4 border-b border-border bg-neutral-50 flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-wider">
          Earn Inks
        </h2>
        <div className="flex items-center gap-4">
          {isGitHubConnected && <RefreshStarsButton />}
          <span className="text-xs text-muted font-mono">{inks} inks</span>
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
              Link your GitHub account to track starred repos and earn inks.
            </p>
            <GitHubLoginButton />
          </div>
        )}

        <RepoList>
          {allRepos.map((repo) => {
            const isStarred = starredRepoNames.has(repo.name);
            const isEligible = eligibleRepoNames.has(repo.name);

            return (
              <RepoItem key={repo.name} isStarred={isStarred}>
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
                    <div className="flex items-center gap-2">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm hover:underline block truncate"
                      >
                        {repo.name}
                      </a>
                      {isEligible && (
                        <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 bg-black text-white flex-shrink-0">
                          Top 5
                        </span>
                      )}
                    </div>
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

                {isStarred && isEligible ? (
                  <span className="text-xs font-mono uppercase tracking-wider text-black ml-4 flex-shrink-0">
                    +{GITHUB_CONFIG.INKS_PER_STAR} inks
                  </span>
                ) : isStarred ? (
                  <span className="text-xs font-mono uppercase tracking-wider text-muted ml-4 flex-shrink-0">
                    Starred
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
              </RepoItem>
            );
          })}
        </RepoList>

        <p className="text-sm text-muted text-center pt-4 border-t border-border">
          Star top {GITHUB_CONFIG.MAX_ELIGIBLE_REPOS} repos to earn inks | 1
          repo = {GITHUB_CONFIG.INKS_PER_STAR} inks
        </p>
      </div>
    </ProfileSection>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Suspense fallback={null}>
        <InkDropAnimationWrapper />
      </Suspense>

      <main className="px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <ProfileTitle>Profile</ProfileTitle>

          <Suspense fallback={<ProfileCardSkeleton />}>
            <ProfileUserCard />
          </Suspense>

          <Suspense fallback={<SectionSkeleton title="Connected Accounts" />}>
            <ConnectedAccountsSection />
          </Suspense>

          <Suspense fallback={<MembershipSkeleton />}>
            <InksSection />
          </Suspense>

          <Suspense fallback={<SectionSkeleton title="Account Details" />}>
            <AccountDetailsSection />
          </Suspense>

          <Suspense fallback={<ReposSkeleton />}>
            <SuggestedReposSection />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
