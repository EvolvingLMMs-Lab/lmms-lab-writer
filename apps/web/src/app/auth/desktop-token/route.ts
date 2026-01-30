import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Server-side endpoint to get tokens for desktop login
// This is needed because client-side getSession() doesn't return full refresh token
export async function GET() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    return NextResponse.redirect(new URL("/login?source=desktop&error=not_logged_in", process.env.NEXT_PUBLIC_BASE_URL || "https://writer.lmms-lab.com"));
  }

  // Redirect to desktop-success with tokens
  const params = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  return NextResponse.redirect(new URL(`/auth/desktop-success?${params}`, process.env.NEXT_PUBLIC_BASE_URL || "https://writer.lmms-lab.com"));
}
