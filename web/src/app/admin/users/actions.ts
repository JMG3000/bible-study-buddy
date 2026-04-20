"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { getCurrentViewer } from "@/lib/lesson-plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appendMessage } from "@/lib/urls";

const ALLOWED_ROLES: UserRole[] = ["user", "creator", "admin"];

function buildUsersRedirect(key: string, message: string) {
  return appendMessage("/admin/users", key, message);
}

export async function updateUserRoleAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const viewer = await getCurrentViewer();

  if (!supabase) {
    redirect(buildUsersRedirect("error", "Supabase is not configured yet."));
  }

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.role !== "admin") {
    redirect(buildUsersRedirect("error", "Only admins can manage account roles."));
  }

  const targetUserId = String(formData.get("userId") ?? "").trim();
  const nextRole = String(formData.get("role") ?? "").trim() as UserRole;

  if (!targetUserId || !ALLOWED_ROLES.includes(nextRole)) {
    redirect(buildUsersRedirect("error", "Choose a valid user and role change."));
  }

  if (targetUserId === viewer.userId && nextRole !== "admin") {
    redirect(
      buildUsersRedirect(
        "error",
        "Keep your own account as admin here so you do not lock yourself out.",
      ),
    );
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("user_id", targetUserId)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ role: nextRole })
    .eq("user_id", targetUserId);

  if (error) {
    redirect(
      buildUsersRedirect(
        "error",
        error.message ?? "We could not update that account role yet.",
      ),
    );
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/reports");
  revalidatePath("/dashboard");

  const targetHandle =
    (targetProfile as { handle?: string } | null)?.handle ?? "That user";

  redirect(
    buildUsersRedirect(
      "updated",
      `@${targetHandle} is now assigned the ${nextRole} role.`,
    ),
  );
}
