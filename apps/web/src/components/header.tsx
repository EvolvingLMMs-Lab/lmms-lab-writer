import { Suspense } from "react";
import Link from "next/link";
import { Github } from "lucide-react";

import { UserDropdown } from "@/components/user-dropdown";
import { createClient } from "@/lib/supabase/server";

type UserProfile = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  tier: "free" | "supporter";
  expiresAt: string | null;
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

  return {
    email: session.user.email ?? "",
    name: metadata.full_name || metadata.name || metadata.user_name || null,
    avatarUrl: metadata.avatar_url || metadata.picture || null,
    tier: (membership?.tier as "free" | "supporter") || "free",
    expiresAt: membership?.expires_at ?? null,
  };
}

function AuthButtonFallback() {
  return (
    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-100 text-transparent text-xs sm:text-sm border-2 border-neutral-200 whitespace-nowrap animate-pulse">
      Loading...
    </div>
  );
}

async function AuthButton() {
  const user = await getUser();

  if (user) {
    return (
      <UserDropdown
        email={user.email}
        name={user.name}
        avatarUrl={user.avatarUrl}
        tier={user.tier}
        expiresAt={user.expiresAt}
      />
    );
  }

  return (
    <Link
      href="/login"
      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black text-xs sm:text-sm border-2 border-black hover:bg-neutral-100 active:bg-neutral-200 transition-colors whitespace-nowrap"
    >
      Get Started
    </Link>
  );
}

export function Header() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-50 px-4 sm:px-6">
      <div className="w-full max-w-5xl mx-auto py-3 sm:py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 sm:gap-3"
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
          <span className="hidden sm:inline">LMMs-Lab Writer</span>
          <span className="sm:hidden">Writer</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Suspense fallback={<AuthButtonFallback />}>
            <AuthButton />
          </Suspense>
          <Link
            href="https://github.com/Luodian/latex-writer/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted/60 hover:text-muted transition-colors flex items-center gap-1 sm:gap-1.5 text-xs"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Feedback</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
