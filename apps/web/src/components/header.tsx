import Link from "next/link";
import { Github } from "lucide-react";

import { UserDropdown } from "@/components/user-dropdown";
import { getDaysRemaining } from "@/lib/github/config";
import { createClient } from "@/lib/supabase/server";

type UserProfile = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  tier: "free" | "supporter";
  daysRemaining: number | null;
};

async function getUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const metadata = session.user.user_metadata || {};

  const { data: membership } = await supabase
    .from("user_memberships")
    .select("tier, expires_at")
    .eq("user_id", session.user.id)
    .single();

  const expiresAt = membership?.expires_at
    ? new Date(membership.expires_at)
    : null;

  return {
    email: session.user.email ?? "",
    name: metadata.full_name || metadata.name || metadata.user_name || null,
    avatarUrl: metadata.avatar_url || metadata.picture || null,
    tier: (membership?.tier as "free" | "supporter") || "free",
    daysRemaining: getDaysRemaining(expiresAt),
  };
}

export async function Header() {
  const user = await getUser();

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight flex items-center gap-3"
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
        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/Luodian/latex-writer/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted/60 hover:text-muted transition-colors flex items-center gap-1.5 text-xs"
          >
            <Github className="w-3.5 h-3.5" />
            Feedback
          </Link>
          {user ? (
            <UserDropdown
              email={user.email}
              name={user.name}
              avatarUrl={user.avatarUrl}
              tier={user.tier}
              daysRemaining={user.daysRemaining}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted hover:text-black transition-colors hidden sm:block"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-white text-black text-sm border-2 border-black hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
