import Link from "next/link";

import { UserDropdown } from "@/components/user-dropdown";
import { getDaysRemaining } from "@/lib/github/config";
import { createClient } from "@/lib/supabase/server";
import { NewDocumentButton } from "@/app/(app)/dashboard/new-document-button";

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

type HeaderProps = {
  hideNewButton?: boolean;
};

export async function Header({ hideNewButton = false }: HeaderProps) {
  const user = await getUser();

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
        {user ? (
          <div className="flex items-center gap-4">
            {!hideNewButton && <NewDocumentButton />}
            <UserDropdown
              email={user.email}
              name={user.name}
              avatarUrl={user.avatarUrl}
              tier={user.tier}
              daysRemaining={user.daysRemaining}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted hover:text-black transition-colors hidden sm:block"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-black text-white text-sm hover:bg-neutral-700 active:bg-neutral-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
