import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  appendMessage,
  AUTH_SESSION_EXPIRED_MESSAGE,
  IDLE_ACTIVITY_COOKIE,
  POST_AUTH_REDIRECT_COOKIE,
} from "@/lib/urls";

export async function GET(request: NextRequest) {
  const reason = request.nextUrl.searchParams.get("reason");
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut({ scope: "local" });
  }

  const loginPath =
    reason === "expired"
      ? appendMessage("/login", "error", AUTH_SESSION_EXPIRED_MESSAGE)
      : "/login";
  const response = NextResponse.redirect(new URL(loginPath, request.url));
  response.cookies.delete(POST_AUTH_REDIRECT_COOKIE);
  response.cookies.delete(IDLE_ACTIVITY_COOKIE);
  return response;
}
