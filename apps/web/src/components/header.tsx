"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Github, ChevronDown, Globe } from "lucide-react";

import { UserDropdown } from "@/components/user-dropdown";
import { getUserCacheFromCookie, type CachedUser } from "@/lib/user-cache";
import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  setLocaleCookie,
  stripLocalePrefix,
  withLocalePrefix,
  type Locale,
} from "@/lib/i18n";
import { getMessages } from "@/lib/messages";

function AuthButtonFallback({ label }: { label: string }) {
  return (
    <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-100 text-transparent text-xs sm:text-sm border-2 border-neutral-200 whitespace-nowrap">
      {label}
    </div>
  );
}

function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = stripLocalePrefix(pathname || "/");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(targetLocale: Locale) {
    setLocaleCookie(targetLocale);
    setOpen(false);
    router.push(withLocalePrefix(basePath, targetLocale));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 border border-border text-xs text-muted hover:text-foreground hover:bg-neutral-100 transition-colors"
        aria-label={label}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{LOCALE_LABELS[locale]}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 min-w-[7rem] bg-white border border-border shadow-[2px_2px_0_0_rgba(0,0,0,1)] z-50">
          {SUPPORTED_LOCALES.map((targetLocale) => (
            <button
              key={targetLocale}
              onClick={() => handleSelect(targetLocale)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                targetLocale === locale
                  ? "bg-foreground text-white"
                  : "text-muted hover:text-foreground hover:bg-neutral-100"
              }`}
            >
              {LOCALE_LABELS[targetLocale]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header({
  locale = DEFAULT_LOCALE,
  showLanguageSwitcher = false,
}: {
  locale?: Locale;
  showLanguageSwitcher?: boolean;
}) {
  const [user, setUser] = useState<CachedUser | null | undefined>(undefined);
  const messages = getMessages(locale);

   
  useEffect(() => {
    setUser(getUserCacheFromCookie());
  }, []);

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50 px-4 sm:px-6">
      <div className="w-full max-w-5xl mx-auto py-3 sm:py-4 flex items-center justify-between">
        <Link
          href={withLocalePrefix("/", locale)}
          prefetch={true}
          className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 sm:gap-3"
        >
          <Image
            src="/logo-small-light.svg"
            alt="LMMs-Lab Writer"
            width={32}
            height={32}
            priority
            className="h-7 sm:h-8 w-auto"
          />
          <span className="hidden sm:inline">LMMs-Lab Writer</span>
          <span className="sm:hidden">Writer</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {showLanguageSwitcher && (
            <LanguageSwitcher locale={locale} label={messages.header.language} />
          )}
          {user === undefined ? (
            <AuthButtonFallback label={messages.header.loading} />
          ) : user ? (
            <UserDropdown
              email={user.email}
              name={user.name}
              avatarUrl={user.avatarUrl}
              inks={user.inks}
              canDownload={user.canDownload}
              locale={locale}
            />
          ) : (
            <Link
              href="/login"
              prefetch={true}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black text-xs sm:text-sm border-2 border-black hover:bg-neutral-100 active:bg-neutral-200 transition-colors whitespace-nowrap"
            >
              {messages.header.getStarted}
            </Link>
          )}
          <Link
            href="https://github.com/EvolvingLMMs-Lab/lmms-lab-writer/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted/60 hover:text-muted transition-colors flex items-center gap-1 sm:gap-1.5 text-xs"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{messages.header.feedback}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
