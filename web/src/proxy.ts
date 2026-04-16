import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  IDLE_ACTIVITY_COOKIE,
  IDLE_SESSION_TIMEOUT_MS,
  POST_AUTH_REDIRECT_COOKIE,
  sanitizeNextPath,
} from "@/lib/urls";

const protectedPrefixes = ["/create", "/dashboard", "/admin", "/settings"];

function isProtectedRoute(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function buildCookieOptions(maxAge: number) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.siteUrl.startsWith("https://"),
    maxAge,
  };
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const nextPath = sanitizeNextPath(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    "/dashboard",
  );
  const currentRedirectPath = sanitizeNextPath(
    request.cookies.get(POST_AUTH_REDIRECT_COOKIE)?.value,
    "/dashboard",
  );
  const lastActivityCookie = request.cookies.get(IDLE_ACTIVITY_COOKIE)?.value;
  const lastActivityAt = Number.parseInt(lastActivityCookie ?? "", 10);

  if (
    isAuthenticated &&
    request.nextUrl.pathname !== "/auth/logout" &&
    Number.isFinite(lastActivityAt) &&
    Date.now() - lastActivityAt >= IDLE_SESSION_TIMEOUT_MS
  ) {
    const logoutUrl = new URL("/auth/logout", request.url);
    logoutUrl.searchParams.set("reason", "expired");
    const logoutResponse = NextResponse.redirect(logoutUrl);
    logoutResponse.cookies.delete(POST_AUTH_REDIRECT_COOKIE);
    logoutResponse.cookies.delete(IDLE_ACTIVITY_COOKIE);
    return logoutResponse;
  }

  if (request.nextUrl.pathname === "/login" && isAuthenticated) {
    const loginRedirect = NextResponse.redirect(
      new URL(currentRedirectPath, request.url),
    );
    loginRedirect.cookies.delete(POST_AUTH_REDIRECT_COOKIE);
    loginRedirect.cookies.set(
      IDLE_ACTIVITY_COOKIE,
      Date.now().toString(),
      buildCookieOptions(Math.ceil(IDLE_SESSION_TIMEOUT_MS / 1000)),
    );
    return loginRedirect;
  }

  if (isProtectedRoute(request.nextUrl.pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    const loginResponse = NextResponse.redirect(loginUrl);
    loginResponse.cookies.set(
      POST_AUTH_REDIRECT_COOKIE,
      nextPath,
      buildCookieOptions(60 * 10),
    );
    loginResponse.cookies.delete(IDLE_ACTIVITY_COOKIE);
    return loginResponse;
  }

  if (isAuthenticated) {
    response.cookies.set(
      IDLE_ACTIVITY_COOKIE,
      Date.now().toString(),
      buildCookieOptions(Math.ceil(IDLE_SESSION_TIMEOUT_MS / 1000)),
    );
  } else {
    response.cookies.delete(IDLE_ACTIVITY_COOKIE);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
