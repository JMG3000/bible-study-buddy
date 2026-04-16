import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appendMessage, sanitizeNextPath } from "@/lib/urls";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(
    request.nextUrl.searchParams.get("next"),
    "/dashboard",
  );

  if (!code) {
    const loginUrl = new URL(
      appendMessage(
        `/login?next=${encodeURIComponent(nextPath)}`,
        "error",
        "Sign-in did not return an authorization code.",
      ),
      request.url,
    );

    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const loginUrl = new URL(
      appendMessage(
        `/login?next=${encodeURIComponent(nextPath)}`,
        "error",
        "Supabase auth is not configured in this environment.",
      ),
      request.url,
    );

    return NextResponse.redirect(loginUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL(
      appendMessage(
        `/login?next=${encodeURIComponent(nextPath)}`,
        "error",
        error.message,
      ),
      request.url,
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
