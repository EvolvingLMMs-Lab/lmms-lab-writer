"use client";

import { createClient } from "@/lib/supabase/client";
import { clearUserCacheCookie } from "@/lib/user-cache";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";

type Props = {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  inks?: number;
  canDownload?: boolean;
};

export function UserDropdown({
  email,
  name,
  avatarUrl,
  inks = 0,
  canDownload = false,
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
    clearUserCacheCookie();
    const supabase = createClient();
    await supabase.auth.signOut();
    startTransition(() => {
      router.push("/login");
      router.refresh();
    });
  }

  const displayName = name || email.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
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
            <span className="text-sm font-medium text-neutral-600">
              {initial}
            </span>
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

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-50">
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
                <span className="text-lg font-medium text-neutral-600">
                  {initial}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              {name && <p className="font-medium truncate">{name}</p>}
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

          <div className="px-5 py-4 border-b border-border bg-neutral-50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted uppercase tracking-wider">
                  Inks
                </span>
                <p className="text-sm font-mono mt-1">{inks}/30</p>
              </div>
              {canDownload ? (
                <Link
                  href="/download"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-medium hover:text-black transition-colors"
                >
                  Download
                </Link>
              ) : (
                <Link
                  href="/profile#earn-inks"
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-muted hover:text-black transition-colors"
                >
                  Earn more
                </Link>
              )}
            </div>
          </div>

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
