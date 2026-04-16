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

function buildDashboardRedirect(key: string, message: string) {
  return appendMessage("/dashboard", key, message);
}

export async function updateHandleAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(buildDashboardRedirect("handleError", "Supabase is not configured yet."));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const handle = normalizeHandle(String(formData.get("handle") ?? "").trim());

  if (!handle) {
    redirect(
      buildDashboardRedirect(
        "handleError",
        "Enter a handle with letters or numbers so people can find your lessons.",
      ),
    );
  }

  if (handle.length > 30) {
    redirect(
      buildDashboardRedirect(
        "handleError",
        "Keep your handle to 30 characters or fewer.",
      ),
    );
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ handle })
    .eq("user_id", user.id);

  if (profileError) {
    redirect(
      buildDashboardRedirect(
        "handleError",
        profileError.code === "23505"
          ? "That handle is already taken. Try another one."
          : profileError.message ?? "We could not update your handle yet.",
      ),
    );
  }

  const { error: planError } = await supabase
    .from("lesson_plans")
    .update({ author_handle: handle })
    .eq("author_id", user.id);

  if (planError) {
    redirect(
      buildDashboardRedirect(
        "handleError",
        planError.message ?? "Your handle changed, but your lessons did not sync yet.",
      ),
    );
  }

  revalidateTag(HOME_TAG, { expire: 0 });
  revalidateTag(PLAN_LIST_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/dashboard");

  redirect("/dashboard?handle=saved");
}
