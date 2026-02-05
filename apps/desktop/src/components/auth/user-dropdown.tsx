"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CaretDownIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { useAuth, type UserProfile } from "@/lib/auth";

type Props = {
  profile: UserProfile;
};

function formatExpiryDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UserDropdown({ profile }: Props) {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { email, name, avatarUrl, tier, expiresAt } = profile;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
    setIsOpen(false);
  }

  async function handleOpenProfile() {
    setIsOpen(false);
    const { open } = await import("@tauri-apps/plugin-shell");
    await open("https://writer.lmms-lab.com/profile");
  }

  const displayName = name || email.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        aria-expanded={isOpen}
        aria-haspopup="menu"
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
        <CaretDownIcon
          className={`size-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] z-50"
          role="menu"
        >
          <button
            onClick={handleOpenProfile}
            className="w-full p-5 border-b border-border flex items-center gap-4 hover:bg-neutral-50 transition-colors group text-left"
            role="menuitem"
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
            <CaretRightIcon className="size-4 text-muted group-hover:text-black transition-colors flex-shrink-0" />
          </button>

          <div className="px-5 py-4 border-b border-border bg-neutral-50">
            {tier === "supporter" && expiresAt ? (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted uppercase tracking-wider">
                    Membership
                  </span>
                  <p className="text-sm mt-1">
                    Expires {formatExpiryDate(expiresAt)}
                  </p>
                </div>
                <button
                  onClick={handleOpenProfile}
                  className="text-xs text-muted hover:text-black transition-colors"
                  role="menuitem"
                >
                  Manage
                </button>
              </div>
            ) : (
              <button
                onClick={handleOpenProfile}
                className="flex items-center justify-between w-full group"
                role="menuitem"
              >
                <span className="text-sm font-medium">
                  Star repos to unlock
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted group-hover:text-black transition-colors">
                  Unlock
                  <ArrowRightIcon className="size-3" weight="bold" />
                </span>
              </button>
            )}
          </div>

          <div className="px-5 py-3">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-sm text-muted hover:text-black transition-colors disabled:opacity-50"
              role="menuitem"
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
