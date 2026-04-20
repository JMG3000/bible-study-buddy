"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types";
import {
  canManageUsersRole,
  getCurrentViewer,
  isWebmasterSupremeRole,
} from "@/lib/lesson-plans";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { appendMessage } from "@/lib/urls";

const ALLOWED_ROLES: UserRole[] = ["user", "creator", "reviewer", "admin"];
const WEBMASTER_ACTIONS = [
  "clear_drafts",
  "clear_published_lessons",
  "clear_unpublished_lessons",
  "clear_study_series",
  "clear_reports_created",
  "clear_reports_against",
  "clear_saved_favorites",
] as const;

type WebmasterAction = (typeof WEBMASTER_ACTIONS)[number];

function buildUsersRedirect(key: string, message: string) {
  return appendMessage("/admin/users", key, message);
}

export async function updateUserRoleAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const viewer = await getCurrentViewer();

  if (!supabase) {
    redirect(buildUsersRedirect("error", "User management is not available right now."));
  }

  if (!viewer) {
    redirect("/login");
  }

  if (!canManageUsersRole(viewer.role)) {
    redirect(
      buildUsersRedirect(
        "error",
        "Only admins or the Webmaster Supreme can manage account roles.",
      ),
    );
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
    .select("handle, role")
    .eq("user_id", targetUserId)
    .maybeSingle();

  const typedTargetProfile = targetProfile as
    | { handle?: string; role?: UserRole }
    | null;

  if (isWebmasterSupremeRole(typedTargetProfile?.role)) {
    redirect(
      buildUsersRedirect(
        "error",
        "Webmaster Supreme is a manual-only role and cannot be changed from this page.",
      ),
    );
  }

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

  const targetHandle = typedTargetProfile?.handle ?? "That user";

  redirect(
    buildUsersRedirect(
      "updated",
      `@${targetHandle} is now assigned the ${nextRole} role.`,
    ),
  );
}

export async function resetUserMetricsAction(formData: FormData) {
  const viewer = await getCurrentViewer();
  const serviceClient = createSupabaseServiceClient();

  if (!viewer) {
    redirect("/login");
  }

  if (!isWebmasterSupremeRole(viewer.role)) {
    redirect(
      buildUsersRedirect(
        "error",
        "Only the Webmaster Supreme can reset user metrics and authored content.",
      ),
    );
  }

  if (!serviceClient) {
    redirect(
      buildUsersRedirect(
        "error",
        "Those Webmaster controls are not available right now.",
      ),
    );
  }

  const targetUserId = String(formData.get("userId") ?? "").trim();

  if (!targetUserId) {
    redirect(buildUsersRedirect("error", "Choose a valid account first."));
  }

  const { data: targetProfile } = await serviceClient
    .from("profiles")
    .select("handle, role")
    .eq("user_id", targetUserId)
    .maybeSingle();

  const typedTargetProfile = targetProfile as
    | { handle?: string; role?: UserRole }
    | null;

  if (!typedTargetProfile) {
    redirect(buildUsersRedirect("error", "We could not find that account."));
  }

  if (
    isWebmasterSupremeRole(typedTargetProfile.role) &&
    targetUserId !== viewer.userId
  ) {
    redirect(
      buildUsersRedirect(
        "error",
        "Webmaster Supreme accounts can only be reset by themselves.",
      ),
    );
  }

  const { data: lessonRows } = await serviceClient
    .from("lesson_plans")
    .select("id")
    .eq("author_id", targetUserId);

  const lessonIds = ((lessonRows as Array<{ id: string }> | null) ?? []).map(
    (row) => row.id,
  );

  if (lessonIds.length > 0) {
    await serviceClient
      .from("reports")
      .delete()
      .in("lesson_plan_id", lessonIds);
  }

  await serviceClient
    .from("reports")
    .delete()
    .eq("reporter_id", targetUserId);

  await serviceClient
    .from("study_series")
    .delete()
    .eq("author_id", targetUserId);

  await serviceClient
    .from("lesson_plans")
    .delete()
    .eq("author_id", targetUserId);

  await serviceClient
    .from("favorites")
    .delete()
    .eq("user_id", targetUserId);

  revalidatePath("/admin/users");
  revalidatePath("/admin/reports");
  revalidatePath("/dashboard");
  revalidatePath("/plans");

  redirect(
    buildUsersRedirect(
      "updated",
      `Reset report metrics and cleared authored content for @${typedTargetProfile.handle ?? "user"}.`,
    ),
  );
}

function isWebmasterAction(value: string): value is WebmasterAction {
  return WEBMASTER_ACTIONS.includes(value as WebmasterAction);
}

function revalidateUserAdminSurfaces() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/reports");
  revalidatePath("/dashboard");
  revalidatePath("/plans");
}

export async function runWebmasterControlAction(formData: FormData) {
  const viewer = await getCurrentViewer();
  const serviceClient = createSupabaseServiceClient();

  if (!viewer) {
    redirect("/login");
  }

  if (!isWebmasterSupremeRole(viewer.role)) {
    redirect(
      buildUsersRedirect(
        "error",
        "Only the Webmaster Supreme can use those controls.",
      ),
    );
  }

  if (!serviceClient) {
    redirect(
      buildUsersRedirect(
        "error",
        "Those Webmaster controls are not available right now.",
      ),
    );
  }

  const targetUserId = String(formData.get("userId") ?? "").trim();
  const requestedAction = String(formData.get("actionKind") ?? "").trim();

  if (!targetUserId || !isWebmasterAction(requestedAction)) {
    redirect(buildUsersRedirect("error", "Choose a valid Webmaster action."));
  }

  const { data: targetProfile } = await serviceClient
    .from("profiles")
    .select("handle, role")
    .eq("user_id", targetUserId)
    .maybeSingle();

  const typedTargetProfile = targetProfile as
    | { handle?: string; role?: UserRole }
    | null;

  if (!typedTargetProfile) {
    redirect(buildUsersRedirect("error", "We could not find that account."));
  }

  if (
    isWebmasterSupremeRole(typedTargetProfile.role) &&
    targetUserId !== viewer.userId
  ) {
    redirect(
      buildUsersRedirect(
        "error",
        "Webmaster Supreme accounts can only be adjusted by themselves.",
      ),
    );
  }

  const { data: lessonRows } = await serviceClient
    .from("lesson_plans")
    .select("id")
    .eq("author_id", targetUserId);

  const lessonIds = ((lessonRows as Array<{ id: string }> | null) ?? []).map(
    (row) => row.id,
  );

  let successMessage = "";

  switch (requestedAction) {
    case "clear_drafts":
      await serviceClient
        .from("lesson_plans")
        .delete()
        .eq("author_id", targetUserId)
        .eq("status", "draft");
      successMessage = `Cleared draft lessons for @${typedTargetProfile.handle ?? "user"}.`;
      break;
    case "clear_published_lessons":
      await serviceClient
        .from("lesson_plans")
        .delete()
        .eq("author_id", targetUserId)
        .eq("status", "published");
      successMessage = `Cleared published lessons for @${typedTargetProfile.handle ?? "user"}.`;
      break;
    case "clear_unpublished_lessons":
      await serviceClient
        .from("lesson_plans")
        .delete()
        .eq("author_id", targetUserId)
        .eq("status", "unpublished");
      successMessage = `Cleared unpublished lessons for @${typedTargetProfile.handle ?? "user"}.`;
      break;
    case "clear_study_series":
      await serviceClient
        .from("study_series")
        .delete()
        .eq("author_id", targetUserId);
      successMessage = `Cleared study series for @${typedTargetProfile.handle ?? "user"}.`;
      break;
    case "clear_reports_created":
      await serviceClient
        .from("reports")
        .delete()
        .eq("reporter_id", targetUserId);
      successMessage = `Cleared reports created by @${typedTargetProfile.handle ?? "user"}.`;
      break;
    case "clear_reports_against":
      if (lessonIds.length > 0) {
        await serviceClient
          .from("reports")
          .delete()
          .in("lesson_plan_id", lessonIds);
      }
      successMessage = `Cleared reports filed against lessons by @${typedTargetProfile.handle ?? "user"}.`;
      break;
    case "clear_saved_favorites":
      await serviceClient
        .from("favorites")
        .delete()
        .eq("user_id", targetUserId);
      successMessage = `Cleared saved favorites for @${typedTargetProfile.handle ?? "user"}.`;
      break;
  }

  revalidateUserAdminSurfaces();

  redirect(buildUsersRedirect("updated", successMessage));
}
