"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  appendMessage,
  IDLE_ACTIVITY_COOKIE,
  POST_AUTH_REDIRECT_COOKIE,
  sanitizeNextPath,
} from "@/lib/urls";

type OAuthProvider = "google" | "github";

function buildLoginRedirect(message: string) {
  return appendMessage(
    appendMessage("/login", "error", message),
    "ts",
    Date.now().toString(),
  );
}

function getRedirectCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.siteUrl.startsWith("https://"),
    maxAge: 60 * 10,
  };
}

export async function signInWithOAuthAction(formData: FormData) {
  const provider = formData.get("provider");
  const cookieStore = await cookies();
  const nextPath = sanitizeNextPath(
    cookieStore.get(POST_AUTH_REDIRECT_COOKIE)?.value,
    "/dashboard",
  );

  if (provider !== "google" && provider !== "github") {
    redirect(buildLoginRedirect("Choose a supported sign-in provider."));
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildLoginRedirect("Sign-in is not available right now."));
  }

  cookieStore.set(POST_AUTH_REDIRECT_COOKIE, nextPath, getRedirectCookieOptions());

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    options: {
      redirectTo: `${env.siteUrl}/auth/callback`,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    redirect(buildLoginRedirect(error?.message ?? "Unable to start the OAuth sign-in flow."));
  }

  redirect(data.url);
}

export async function signOutAction() {
  const cookieStore = await cookies();
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut({ scope: "local" });
  }

  cookieStore.delete(POST_AUTH_REDIRECT_COOKIE);
  cookieStore.delete(IDLE_ACTIVITY_COOKIE);

  redirect("/");
}
