"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type MembershipTier = "free" | "supporter";

type Props = {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  tier?: MembershipTier;
  daysRemaining?: number | null;
  documentsCount?: number;
};

export function UserDropdown({
  email,
  name,
  avatarUrl,
  tier = "free",
  daysRemaining,
  documentsCount = 0,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const displayName = name || email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-8 border border-border"
          />
        ) : (
          <div className="size-8 bg-black text-white flex items-center justify-center">
            <span className="text-sm font-bold">{initial}</span>
          </div>
        )}
        <svg
          className={`size-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-50">
          {/* User Info */}
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="size-12 border border-border"
                />
              ) : (
                <div className="size-12 bg-black text-white flex items-center justify-center">
                  <span className="text-lg font-bold">{initial}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                {name && (
                  <p className="font-medium truncate">{name}</p>
                )}
                <p className="text-sm text-muted truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Membership Status */}
          <div className="p-5 border-b border-border bg-neutral-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-muted">
                Membership
              </span>
              <span
                className={`text-xs font-mono uppercase px-2 py-0.5 ${
                  tier === "supporter"
                    ? "bg-black text-white"
                    : "border border-neutral-300 text-muted"
                }`}
              >
                {tier}
              </span>
            </div>
            {tier === "supporter" && daysRemaining !== null && daysRemaining !== undefined && (
              <p className="text-sm text-muted mb-3">
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : "Expired"}
              </p>
            )}
            {tier === "free" && (
              <p className="text-sm text-muted mb-3">Star repos to unlock</p>
            )}
            <Link
              href="/dashboard/membership"
              onClick={() => setIsOpen(false)}
              className="inline-block text-sm text-black hover:underline"
            >
              {tier === "free" ? "Unlock →" : "Manage →"}
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-muted">Documents</span>
              <span className="font-mono tabular-nums">{documentsCount}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full px-4 py-3 text-left hover:bg-neutral-100 transition-colors disabled:opacity-50 flex items-center gap-3"
            >
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
