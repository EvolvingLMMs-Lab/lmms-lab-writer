import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { getDaysRemaining } from "@/lib/github/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, Star, User, ArrowRight } from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  tier: "free" | "supporter";
  daysRemaining: number | null;
  totalStars: number;
};

async function getDashboardData(): Promise<UserProfile> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  const user = session.user;
  const metadata = user.user_metadata || {};

  const { data: membership } = await supabase
    .from("user_memberships")
    .select("tier, expires_at, total_star_count")
    .eq("user_id", user.id)
    .single();

  const expiresAt = membership?.expires_at
    ? new Date(membership.expires_at)
    : null;

  return {
    id: user.id,
    email: user.email ?? "",
    name: metadata.full_name || metadata.name || metadata.user_name || null,
    avatarUrl: metadata.avatar_url || metadata.picture || null,
    tier: (membership?.tier as "free" | "supporter") || "free",
    daysRemaining: getDaysRemaining(expiresAt),
    totalStars: membership?.total_star_count || 0,
  };
}

export default async function DashboardPage() {
  const profile = await getDashboardData();
  const displayName = profile.name || profile.email.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight">Dashboard</h1>
          <p className="text-muted mt-2">Welcome back, {displayName}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="border border-border p-6">
            <div className="flex items-center gap-4 mb-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={displayName}
                  className="size-12 border border-border"
                />
              ) : (
                <div className="size-12 border border-border bg-neutral-100 flex items-center justify-center">
                  <span className="text-xl font-light text-neutral-600">
                    {initial}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted">{profile.email}</p>
              </div>
            </div>
            <Link
              href="/profile"
              className="text-sm text-muted hover:text-black transition-colors flex items-center gap-1"
            >
              <User className="size-3.5" />
              View Profile
            </Link>
          </div>

          <div className="border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted uppercase tracking-wider">
                Membership
              </span>
              <span
                className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 ${
                  profile.tier === "supporter"
                    ? "bg-black text-white"
                    : "text-muted border border-neutral-300"
                }`}
              >
                {profile.tier}
              </span>
            </div>
            {profile.tier === "supporter" && profile.daysRemaining !== null ? (
              <p className="text-2xl font-light tabular-nums mb-2">
                {profile.daysRemaining}
                <span className="text-sm text-muted ml-1">days left</span>
              </p>
            ) : (
              <p className="text-2xl font-light tabular-nums mb-2">
                {profile.totalStars}
                <span className="text-sm text-muted ml-1">/5 stars</span>
              </p>
            )}
            <Link
              href="/profile#suggested-repos"
              className="text-sm text-muted hover:text-black transition-colors flex items-center gap-1"
            >
              <Star className="size-3.5" />
              {profile.tier === "supporter" ? "Extend" : "Unlock"} with stars
            </Link>
          </div>

          <div className="border border-border p-6 bg-neutral-50">
            <p className="text-xs text-muted uppercase tracking-wider mb-4">
              Get Started
            </p>
            <p className="text-sm mb-4">
              Download the desktop app to start writing your papers with AI.
            </p>
            <Link
              href="/download"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-neutral-800 transition-colors"
            >
              <Download className="size-4" />
              Download App
            </Link>
          </div>
        </div>

        <div className="border border-border">
          <div className="px-6 py-4 border-b border-border bg-neutral-50">
            <h2 className="text-sm font-mono uppercase tracking-wider">
              Quick Actions
            </h2>
          </div>
          <div className="divide-y divide-border">
            <Link
              href="/download"
              className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors group"
            >
              <div>
                <p className="font-medium">Download Desktop App</p>
                <p className="text-sm text-muted">
                  Write papers locally with AI assistance
                </p>
              </div>
              <ArrowRight className="size-5 text-muted group-hover:text-black transition-colors" />
            </Link>
            <Link
              href="/profile"
              className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors group"
            >
              <div>
                <p className="font-medium">Manage Profile</p>
                <p className="text-sm text-muted">
                  View account details and star repos
                </p>
              </div>
              <ArrowRight className="size-5 text-muted group-hover:text-black transition-colors" />
            </Link>
            <Link
              href="/docs"
              className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors group"
            >
              <div>
                <p className="font-medium">Documentation</p>
                <p className="text-sm text-muted">
                  Learn how to use LMMs-Lab Writer
                </p>
              </div>
              <ArrowRight className="size-5 text-muted group-hover:text-black transition-colors" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
