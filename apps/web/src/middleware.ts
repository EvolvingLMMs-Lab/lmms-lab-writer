import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  LOCALE_COOKIE,
  DEFAULT_LOCALE,
  isLocale,
  localeFromAcceptLanguage,
  withLocalePrefix,
} from "@/lib/i18n";

export async function middleware(request: NextRequest) {
  // Auto-detect locale on first visit (no cookie yet, no locale in URL)
  const { pathname } = request.nextUrl;
  const hasLocaleCookie = request.cookies.has(LOCALE_COOKIE);
  const firstSegment = pathname.split("/")[1];
  const urlHasLocale = firstSegment ? isLocale(firstSegment) : false;

  if (!hasLocaleCookie && !urlHasLocale) {
    const detected = localeFromAcceptLanguage(
      request.headers.get("accept-language"),
    );

    if (detected !== DEFAULT_LOCALE) {
      const url = request.nextUrl.clone();
      url.pathname = withLocalePrefix(pathname, detected);
      const response = NextResponse.redirect(url);
      response.cookies.set(LOCALE_COOKIE, detected, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
