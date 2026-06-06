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

function buildContentSecurityPolicy(nonce: string) {
  const isDev = process.env.NODE_ENV === "development";
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "https://snippet.meticulous.ai",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ];
  const connectSources = [
    "'self'",
    "https://*.supabase.co",
    "https://api.openai.com",
    "https://*.meticulous.ai",
  ];
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' blob: data:",
    "font-src 'self' data:",
    `script-src ${scriptSources.join(" ")}`,
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,
    `connect-src ${connectSources.join(" ")}`,
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}

function applyContentSecurityPolicy(
  response: NextResponse,
  contentSecurityPolicy: string,
) {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

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
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  applyContentSecurityPolicy(response, contentSecurityPolicy);

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
            headers: requestHeaders,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        applyContentSecurityPolicy(response, contentSecurityPolicy);
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
    const logoutResponse = applyContentSecurityPolicy(
      NextResponse.redirect(logoutUrl),
      contentSecurityPolicy,
    );
    logoutResponse.cookies.delete(POST_AUTH_REDIRECT_COOKIE);
    logoutResponse.cookies.delete(IDLE_ACTIVITY_COOKIE);
    return logoutResponse;
  }

  if (request.nextUrl.pathname === "/login" && isAuthenticated) {
    const loginRedirect = applyContentSecurityPolicy(
      NextResponse.redirect(new URL(currentRedirectPath, request.url)),
      contentSecurityPolicy,
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
    const loginResponse = applyContentSecurityPolicy(
      NextResponse.redirect(loginUrl),
      contentSecurityPolicy,
    );
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
