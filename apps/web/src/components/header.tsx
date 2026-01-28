"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Github } from "lucide-react";

import { UserDropdown } from "@/components/user-dropdown";
import { getUserCacheFromCookie, type CachedUser } from "@/lib/user-cache";

function AuthButtonFallback() {
  return (
    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-100 text-transparent text-xs sm:text-sm border-2 border-neutral-200 whitespace-nowrap">
      Loading
    </div>
  );
}

export function Header() {
  const [user, setUser] = useState<CachedUser | null | undefined>(undefined);

  useEffect(() => {
    setUser(getUserCacheFromCookie());
  }, []);

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50 px-4 sm:px-6">
      <div className="w-full max-w-5xl mx-auto py-3 sm:py-4 flex items-center justify-between">
        <Link
          href="/"
          prefetch={true}
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
          {user === undefined ? (
            <AuthButtonFallback />
          ) : user ? (
            <UserDropdown
              email={user.email}
              name={user.name}
              avatarUrl={user.avatarUrl}
              inks={user.inks}
              canDownload={user.canDownload}
            />
          ) : (
            <Link
              href="/login"
              prefetch={true}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black text-xs sm:text-sm border-2 border-black hover:bg-neutral-100 active:bg-neutral-200 transition-colors whitespace-nowrap"
            >
              Get Started
            </Link>
          )}
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
