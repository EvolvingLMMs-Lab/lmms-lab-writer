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
};

export function UserDropdown({
  email,
  name,
  avatarUrl,
  tier = "free",
  daysRemaining,
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
            className="size-8 border border-neutral-300"
          />
        ) : (
          <div className="size-8 border border-neutral-300 flex items-center justify-center">
            <span className="text-sm font-medium text-neutral-600">{initial}</span>
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
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-50">
          {/* User Info - Clickable to Profile */}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="p-5 border-b border-border flex items-center gap-4 hover:bg-neutral-50 transition-colors group"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="size-12 border border-neutral-300"
              />
            ) : (
              <div className="size-12 border border-neutral-300 flex items-center justify-center">
                <span className="text-lg font-medium text-neutral-600">{initial}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              {name && (
                <p className="font-medium truncate">{name}</p>
              )}
              <p className="text-sm text-muted truncate">{email}</p>
            </div>
            <svg
              className="size-4 text-muted group-hover:text-black transition-colors flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          {/* Membership Status */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted uppercase tracking-wider">
                Membership
              </span>
              <span
                className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 ${
                  tier === "supporter"
                    ? "bg-black text-white"
                    : "text-muted"
                }`}
              >
                {tier}
              </span>
            </div>
          </div>

          {/* CTA Section */}
          <div className="px-5 py-4 border-b border-border bg-neutral-50">
            {tier === "supporter" && daysRemaining !== null && daysRemaining !== undefined ? (
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  {daysRemaining > 0 ? `${daysRemaining} days left` : "Expired"}
                </span>
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-muted hover:text-black transition-colors"
                >
                  Manage
                </Link>
              </div>
            ) : (
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between group"
              >
                <span className="text-sm font-medium">Star repos to unlock</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted group-hover:text-black transition-colors">
                  Unlock
                  <svg
                    className="size-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            )}
          </div>

          {/* Sign Out */}
          <div className="px-5 py-3">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-sm text-muted hover:text-black transition-colors disabled:opacity-50"
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
