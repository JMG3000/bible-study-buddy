"use server";

import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appendMessage, sanitizeNextPath } from "@/lib/urls";

type OAuthProvider = "google" | "github";

function buildLoginRedirect(nextPath: string, message: string) {
  return appendMessage(appendMessage(`/login?next=${encodeURIComponent(nextPath)}`, "error", message), "ts", Date.now().toString());
}

export async function signInWithOAuthAction(formData: FormData) {
  const provider = formData.get("provider");
  const nextPath = sanitizeNextPath(formData.get("next"), "/create");

  if (provider !== "google" && provider !== "github") {
    redirect(buildLoginRedirect(nextPath, "Choose a supported sign-in provider."));
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      buildLoginRedirect(
        nextPath,
        "Supabase auth is not configured yet in this environment.",
      ),
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as OAuthProvider,
    options: {
      redirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
    },
  });

  if (error || !data.url) {
    redirect(
      buildLoginRedirect(
        nextPath,
        error?.message ?? "Unable to start the OAuth sign-in flow.",
      ),
    );
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
