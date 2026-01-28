const COOKIE_NAME = "user_cache";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export type CachedUser = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  inks: number;
  canDownload: boolean;
};

export function encodeUserCache(user: CachedUser): string {
  return btoa(JSON.stringify(user));
}

export function decodeUserCache(encoded: string): CachedUser | null {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

export function getUserCacheFromCookie(): CachedUser | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match?.[1]) return null;

  return decodeUserCache(decodeURIComponent(match[1]));
}

export function setUserCacheCookie(user: CachedUser): void {
  if (typeof document === "undefined") return;

  const encoded = encodeURIComponent(encodeUserCache(user));
  document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearUserCacheCookie(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export { COOKIE_NAME, COOKIE_MAX_AGE };
