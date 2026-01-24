"use client";

import { useMembership } from "@/hooks/use-membership";
import { MembershipBadge } from "./membership-badge";
import Link from "next/link";

export function MembershipBadgeClient() {
  const { tier, daysRemaining, isLoading } = useMembership();

  if (isLoading) {
    return (
      <span className="inline-flex items-center bg-neutral-100 text-neutral-400 px-3 py-1 text-xs font-mono uppercase tracking-widest border border-neutral-200 animate-pulse">
        ...
      </span>
    );
  }

  return (
    <Link
      href="/dashboard/membership"
      className="hover:opacity-80 transition-opacity"
    >
      <MembershipBadge tier={tier} daysRemaining={daysRemaining} />
    </Link>
  );
}
