import { createClient } from "@/lib/supabase/server";
import { getDaysRemaining, MembershipTier } from "@/lib/github/config";
import Link from "next/link";
import { redirect } from "next/navigation";

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
  totalStars: number;
};

async function getProfileData(): Promise<{
  profile: UserProfile;
  stats: UserStats;
  membership: MembershipData;
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

  const [ownedResult, sharedResult, membershipResult] = await Promise.all([
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("created_by", user.id),
    supabase
      .from("document_access")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("user_memberships")
      .select("tier, expires_at, total_star_count")
      .eq("user_id", user.id)
      .single(),
  ]);

  const stats: UserStats = {
    documentsOwned: ownedResult.count ?? 0,
    documentsShared: sharedResult.count ?? 0,
  };

  const membershipData = membershipResult.data;
  const expiresAt = membershipData?.expires_at
    ? new Date(membershipData.expires_at)
    : null;

  const membership: MembershipData = {
    tier: (membershipData?.tier as MembershipTier) || "free",
    daysRemaining: getDaysRemaining(expiresAt),
    totalStars: membershipData?.total_star_count || 0,
  };

  return { profile, stats, membership };
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

function getProviderName(provider: string | null): string {
  if (provider === "github") return "GitHub";
  if (provider === "google") return "Google";
  return "Email";
}

export default async function ProfilePage() {
  const { profile, stats, membership } = await getProfileData();
  const displayName = profile.name || profile.email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

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
            href="/dashboard"
            className="text-sm text-muted hover:text-black transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="flex items-start gap-6 mb-12">
          {/* Avatar */}
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={displayName}
              className="size-24 border-2 border-black"
            />
          ) : (
            <div className="size-24 border-2 border-black bg-black text-white flex items-center justify-center">
              <span className="text-4xl font-light">{initial}</span>
            </div>
          )}

          {/* Info */}
          <div className="flex-1 pt-1">
            <h1 className="text-3xl font-light tracking-tight mb-1">
              {displayName}
            </h1>
            <p className="text-muted mb-3">{profile.email}</p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 border border-border text-xs">
                {profile.provider === "github" && (
                  <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                )}
                {profile.provider === "google" && (
                  <svg className="size-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {!profile.provider && (
                  <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {getProviderName(profile.provider)}
              </span>
              <span className="text-xs text-muted">
                Joined {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Documents Owned */}
          <div className="border-2 border-black p-6">
            <p className="text-5xl font-light tabular-nums mb-2">
              {stats.documentsOwned}
            </p>
            <p className="text-sm text-muted">Documents Created</p>
          </div>

          {/* Shared With Me */}
          <div className="border border-border p-6">
            <p className="text-5xl font-light tabular-nums mb-2">
              {stats.documentsShared}
            </p>
            <p className="text-sm text-muted">Shared With Me</p>
          </div>

          {/* Membership */}
          <Link
            href="/dashboard/membership"
            className="border border-border p-6 hover:border-black transition-colors group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-xs font-mono uppercase px-2 py-0.5 ${
                  membership.tier === "supporter"
                    ? "bg-black text-white"
                    : "border border-neutral-300 text-muted"
                }`}
              >
                {membership.tier}
              </span>
              <svg
                className="size-4 text-muted group-hover:text-black transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <p className="text-sm text-muted">
              {membership.tier === "supporter" && membership.daysRemaining
                ? `${membership.daysRemaining} days remaining`
                : "Star repos to unlock"}
            </p>
            {membership.totalStars > 0 && (
              <p className="text-xs text-muted mt-1">
                {membership.totalStars} repos starred
              </p>
            )}
          </Link>
        </div>

        {/* Account Details */}
        <div className="border border-border">
          <div className="px-6 py-4 border-b border-border bg-neutral-50">
            <h2 className="text-sm font-mono uppercase tracking-wider">
              Account Details
            </h2>
          </div>
          <div className="divide-y divide-border">
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-muted">User ID</span>
              <code className="text-sm font-mono bg-neutral-100 px-2 py-1">
                {profile.id.slice(0, 8)}
              </code>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-muted">Email</span>
              <span className="text-sm">{profile.email}</span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-muted">Auth Provider</span>
              <span className="text-sm">{getProviderName(profile.provider)}</span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <span className="text-muted">Member Since</span>
              <span className="text-sm">{formatDate(profile.createdAt)}</span>
            </div>
            {profile.lastSignIn && (
              <div className="px-6 py-4 flex items-center justify-between">
                <span className="text-muted">Last Sign In</span>
                <span className="text-sm">
                  {formatRelativeDate(profile.lastSignIn)}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
