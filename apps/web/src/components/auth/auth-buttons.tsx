"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { User, LogOut, LogIn, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export function AuthButtons() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
  };

  if (loading) {
    return <div className="w-20 h-8 bg-neutral-100 animate-pulse" />;
  }

  if (user) {
    const initial = user.email?.charAt(0).toUpperCase() ?? "U";
    const displayName =
      user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User";

    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 text-sm hover:text-foreground transition-colors"
        >
          <span className="w-7 h-7 bg-foreground text-background flex items-center justify-center text-xs font-medium">
            {initial}
          </span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border-2 border-foreground shadow-[4px_4px_0_0_#000] z-50">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-100 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href="/login" className="btn btn-secondary">
      <LogIn className="w-4 h-4" />
      Login
    </Link>
  );
}
