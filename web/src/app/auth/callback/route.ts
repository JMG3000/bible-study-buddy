import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appendMessage, POST_AUTH_REDIRECT_COOKIE, sanitizeNextPath } from "@/lib/urls";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(
    request.cookies.get(POST_AUTH_REDIRECT_COOKIE)?.value,
    "/dashboard",
  );

  if (!code) {
    const loginUrl = new URL(
      appendMessage("/login", "error", "Sign-in did not return an authorization code."),
      request.url,
    );

    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const loginUrl = new URL(
      appendMessage("/login", "error", "Sign-in is not available right now."),
      request.url,
    );

    return NextResponse.redirect(loginUrl);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL(
      appendMessage("/login", "error", error.message),
      request.url,
    );

    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  response.cookies.delete(POST_AUTH_REDIRECT_COOKIE);
  return response;
}
