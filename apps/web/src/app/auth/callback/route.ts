import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error_param = searchParams.get("error");
  const error_description = searchParams.get("error_description");
  const next = searchParams.get("next") ?? "/profile";

  if (error_param) {
    console.error("OAuth error:", error_param, error_description);
    const errorMsg = encodeURIComponent(error_description || error_param);
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("exchangeCodeForSession error:", error.message);
    const errorMsg = encodeURIComponent(error.message);
    return NextResponse.redirect(`${origin}/login?error=${errorMsg}`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
