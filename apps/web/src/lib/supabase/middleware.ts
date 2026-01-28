import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  encodeUserCache,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
  type CachedUser,
} from "@/lib/user-cache";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Parameters<typeof supabaseResponse.cookies.set>[2];
          }>,
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const metadata = user.user_metadata || {};
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("tier, expires_at")
      .eq("user_id", user.id)
      .single();

    const cachedUser: CachedUser = {
      email: user.email ?? "",
      name: metadata.full_name || metadata.name || metadata.user_name || null,
      avatarUrl: metadata.avatar_url || metadata.picture || null,
      tier: (membership?.tier as "free" | "supporter") || "free",
      expiresAt: membership?.expires_at ?? null,
    };

    supabaseResponse.cookies.set(COOKIE_NAME, encodeUserCache(cachedUser), {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
      httpOnly: false,
    });
  } else {
    supabaseResponse.cookies.delete(COOKIE_NAME);
  }

  const protectedPaths = ["/profile"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const authPaths = ["/login", "/signup"];
  const isAuthPath = authPaths.some(
    (path) => request.nextUrl.pathname === path,
  );

  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
