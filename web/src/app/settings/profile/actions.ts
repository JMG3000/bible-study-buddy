"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { HOME_TAG, PLAN_LIST_TAG } from "@/lib/revalidation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appendMessage } from "@/lib/urls";

function normalizeHandle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function buildProfileRedirect(key: string, message: string) {
  return appendMessage("/settings/profile", key, message);
}

function isMissingAuthorHandleColumnError(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST204" ||
    error.message?.includes("author_handle") === true
  );
}

export async function updateProfileSettingsAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildProfileRedirect("error", "Supabase is not configured yet."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const handle = normalizeHandle(String(formData.get("handle") ?? "").trim());

  if (!displayName) {
    redirect(
      buildProfileRedirect(
        "error",
        "Enter the screen name you want to show in your creator workspace.",
      ),
    );
  }

  if (!handle) {
    redirect(
      buildProfileRedirect(
        "error",
        "Enter a public username with letters or numbers so people can find your lessons.",
      ),
    );
  }

  if (handle.length > 30) {
    redirect(
      buildProfileRedirect(
        "error",
        "Keep your public username to 30 characters or fewer.",
      ),
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      handle,
    })
    .eq("user_id", user.id);

  if (profileError) {
    redirect(
      buildProfileRedirect(
        "error",
        profileError.code === "23505"
          ? "That public username is already taken. Try another one."
          : profileError.message ?? "We could not update your profile yet.",
      ),
    );
  }

  const { data: syncedPlans, error: planError } = await supabase
    .from("lesson_plans")
    .update({ author_handle: handle })
    .eq("author_id", user.id)
    .select("slug, status");

  if (planError) {
    const message = isMissingAuthorHandleColumnError(planError)
      ? "Run the 0005_add_lesson_plan_author_handles.sql migration in Supabase, then save your public username again."
      : planError.message ?? "Your profile changed, but your lessons did not sync yet.";

    redirect(buildProfileRedirect("error", message));
  }

  revalidateTag(HOME_TAG, { expire: 0 });
  revalidateTag(PLAN_LIST_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/dashboard");
  revalidatePath("/settings/profile");

  for (const plan of syncedPlans ?? []) {
    if (plan.status === "published" && plan.slug) {
      revalidatePath(`/plans/${plan.slug}`);
    }
  }

  redirect("/settings/profile?updated=1");
}
