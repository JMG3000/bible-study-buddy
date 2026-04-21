"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReportReason } from "@/lib/types";
import {
  POST_AUTH_REDIRECT_COOKIE,
  appendMessage,
  sanitizeNextPath,
} from "@/lib/urls";
import {
  getCurrentViewer,
  getViewerLessonReportAccess,
} from "@/lib/lesson-plans";

function getRedirectCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.siteUrl.startsWith("https://"),
    maxAge: 60 * 10,
  };
}

function buildReportRedirect(path: string, key: string, value: string) {
  return appendMessage(path, key, value);
}

export async function toggleFavoriteAction(formData: FormData) {
  const lessonPlanId = formData.get("lessonPlanId");
  const redirectPath = sanitizeNextPath(formData.get("returnPath"), "/plans");
  const cookieStore = await cookies();
  const viewer = await getCurrentViewer();

  if (typeof lessonPlanId !== "string" || lessonPlanId.length === 0) {
    redirect(redirectPath);
  }

  if (!viewer) {
    cookieStore.set(
      POST_AUTH_REDIRECT_COOKIE,
      redirectPath,
      getRedirectCookieOptions(),
    );
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(redirectPath);
  }

  const { data: existingFavorite } = await supabase
    .from("favorites")
    .select("lesson_plan_id")
    .eq("user_id", viewer.userId)
    .eq("lesson_plan_id", lessonPlanId)
    .maybeSingle();

  if (existingFavorite) {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", viewer.userId)
      .eq("lesson_plan_id", lessonPlanId);
  } else {
    await supabase.from("favorites").insert({
      user_id: viewer.userId,
      lesson_plan_id: lessonPlanId,
    });
  }

  revalidatePath("/dashboard/saved");
  revalidatePath(redirectPath);
  redirect(redirectPath);
}

const validReportReasons: ReportReason[] = [
  "inaccurate",
  "inappropriate",
  "copyright",
  "spam",
  "other",
];

export async function submitLessonReportAction(formData: FormData) {
  const lessonPlanId = formData.get("lessonPlanId");
  const redirectPath = sanitizeNextPath(formData.get("returnPath"), "/plans");
  const reason = formData.get("reason");
  const detailsEntry = formData.get("details");
  const cookieStore = await cookies();
  const viewer = await getCurrentViewer();

  if (typeof lessonPlanId !== "string" || lessonPlanId.length === 0) {
    redirect(redirectPath);
  }

  if (!viewer) {
    cookieStore.set(
      POST_AUTH_REDIRECT_COOKIE,
      redirectPath,
      getRedirectCookieOptions(),
    );
    redirect("/login");
  }

  if (typeof reason !== "string" || !validReportReasons.includes(reason as ReportReason)) {
    redirect(buildReportRedirect(redirectPath, "reportError", "Choose a reason for the report."));
  }

  const details =
    typeof detailsEntry === "string" && detailsEntry.trim().length > 0
      ? detailsEntry.trim().slice(0, 1000)
      : null;

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      buildReportRedirect(
        redirectPath,
        "reportError",
        "Reporting is not available in this environment yet.",
      ),
    );
  }

  const reportAccess = await getViewerLessonReportAccess(
    lessonPlanId,
    viewer.userId,
  );

  if (!reportAccess.canSubmit) {
    redirect(
      buildReportRedirect(
        redirectPath,
        "reportError",
        reportAccess.helperMessage ??
          "You cannot submit another report for this lesson right now.",
      ),
    );
  }

  const { error } = await supabase.from("reports").insert({
    lesson_plan_id: lessonPlanId,
    reporter_id: viewer.userId,
    reason,
    details,
  });

  if (error) {
    redirect(
      buildReportRedirect(
        redirectPath,
        "reportError",
        "We could not submit that report right now. Please try again.",
      ),
    );
  }

  revalidatePath("/admin/reports");
  revalidatePath(redirectPath);
  redirect(
    buildReportRedirect(
      redirectPath,
      "report",
      "Thank you. Your report has been sent for review.",
    ),
  );
}
