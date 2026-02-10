export const SUPPORTED_LOCALES = ["en", "zh", "ja"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
  ja: "日本語",
};

const localeSet = new Set<string>(SUPPORTED_LOCALES);

export function isLocale(value: string): value is Locale {
  return localeSet.has(value);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (value && isLocale(value)) {
    return value;
  }
  return DEFAULT_LOCALE;
}

function normalizePathname(pathname: string): string {
  if (!pathname.startsWith("/")) {
    return `/${pathname}`;
  }
  return pathname;
}

function trimTrailingSlashes(pathname: string): string {
  if (pathname === "/") {
    return "/";
  }
  return pathname.replace(/\/+$/, "");
}

export function stripLocalePrefix(pathname: string): string {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split("/");
  const maybeLocale = segments[1];

  if (maybeLocale && isLocale(maybeLocale)) {
    const remainder = `/${segments.slice(2).join("/")}`;
    return trimTrailingSlashes(remainder || "/") || "/";
  }

  return trimTrailingSlashes(normalized);
}

export function withLocalePrefix(pathname: string, locale: Locale): string {
  const basePath = stripLocalePrefix(pathname);

  if (locale === DEFAULT_LOCALE) {
    return basePath;
  }

  if (basePath === "/") {
    return `/${locale}`;
  }

  return `/${locale}${basePath}`;
}

export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  let output = template;

  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{${key}}`, String(value));
  }

  return output;
}

const LOCALE_COOKIE = "locale";

export function getLocaleCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`),
  );
  const value = match?.[1];
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

export function setLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export async function getServerLocale(): Promise<Locale> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

export function detectLocale(pathname?: string): Locale {
  if (pathname) {
    const segments = normalizePathname(pathname).split("/");
    const maybeLocale = segments[1];
    if (maybeLocale && isLocale(maybeLocale)) return maybeLocale;
  }
  return getLocaleCookie();
}
