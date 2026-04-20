"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canManageUsersRole,
  canReviewReportsRole,
  getCurrentViewer,
} from "@/lib/lesson-plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/types";
import { appendMessage, sanitizeNextPath } from "@/lib/urls";

function isMissingReportReviewFeatureError(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "PGRST204" ||
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("report_review_threads") === true ||
    error.message?.includes("report_review_messages") === true ||
    error.message?.includes("assigned_reviewer_id") === true ||
    error.message?.includes("resolution_note") === true ||
    error.message?.includes("archived_at") === true
  );
}

function buildReviewRedirect(path: string, key: string, value: string) {
  return appendMessage(path, key, value);
}

function buildMigrationMessage() {
  return "Review conversations are not available right now.";
}

type LoadedReviewContext = {
  report: {
    id: string;
    lesson_plan_id: string;
    reporter_id: string;
    status: ReportStatus;
    assigned_reviewer_id: string | null;
  };
  lesson: {
    id: string;
    slug: string | null;
    title: string;
    author_id: string;
    author_handle: string | null;
  };
  thread: {
    id: string;
    creator_id: string;
    reviewer_id: string;
  } | null;
  reporterHandle: string | null;
  creatorHandle: string | null;
};

async function loadReviewContext(
  reportId: string,
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
) {
  const [{ data: reportRow, error: reportError }, { data: threadRow, error: threadError }] =
    await Promise.all([
      supabase
        .from("reports")
        .select("id, lesson_plan_id, reporter_id, status, assigned_reviewer_id")
        .eq("id", reportId)
        .maybeSingle(),
      supabase
        .from("report_review_threads")
        .select("id, creator_id, reviewer_id")
        .eq("report_id", reportId)
        .maybeSingle(),
    ]);

  if (reportError || !reportRow) {
    return {
      missingFeature: isMissingReportReviewFeatureError(reportError),
      context: null as LoadedReviewContext | null,
    };
  }

  if (isMissingReportReviewFeatureError(threadError)) {
    return {
      missingFeature: true,
      context: null as LoadedReviewContext | null,
    };
  }

  const typedReport = reportRow as LoadedReviewContext["report"];
  const typedThread = (threadRow as LoadedReviewContext["thread"]) ?? null;

  const [{ data: lessonRow, error: lessonError }, { data: profileRows }] = await Promise.all([
    supabase
      .from("lesson_plans")
      .select("id, slug, title, author_id, author_handle")
      .eq("id", typedReport.lesson_plan_id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("user_id, handle")
      .in(
        "user_id",
        [typedReport.reporter_id, typedThread?.creator_id]
          .filter((value): value is string => Boolean(value)),
      ),
  ]);

  if (lessonError || !lessonRow) {
    return {
      missingFeature: false,
      context: null as LoadedReviewContext | null,
    };
  }

  const handleMap = new Map<string, string | null>(
    (((profileRows as Array<{ user_id: string; handle: string | null }> | null) ?? []).map(
      (row) => [row.user_id, row.handle ?? null],
    )),
  );

  return {
    missingFeature: false,
    context: {
      report: typedReport,
      lesson: lessonRow as LoadedReviewContext["lesson"],
      thread: typedThread,
      reporterHandle: handleMap.get(typedReport.reporter_id) ?? null,
      creatorHandle:
        handleMap.get((lessonRow as LoadedReviewContext["lesson"]).author_id) ??
        (lessonRow as LoadedReviewContext["lesson"]).author_handle ??
        null,
    } satisfies LoadedReviewContext,
  };
}

function canViewerModerateContext(
  viewer: Awaited<ReturnType<typeof getCurrentViewer>>,
  context: LoadedReviewContext,
) {
  if (!viewer || !canReviewReportsRole(viewer.role)) {
    return false;
  }

  if (canManageUsersRole(viewer.role)) {
    return true;
  }

  if (
    context.thread?.reviewer_id &&
    context.thread.reviewer_id !== viewer.userId
  ) {
    return false;
  }

  if (
    context.report.assigned_reviewer_id &&
    context.report.assigned_reviewer_id !== viewer.userId
  ) {
    return false;
  }

  return true;
}

function revalidateReviewPaths(context: LoadedReviewContext, reportId: string) {
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportId}`);
  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/reviews/${reportId}`);

  if (context.lesson.slug) {
    revalidatePath(`/plans/${context.lesson.slug}`);
  }
}

export async function openReviewThreadAction(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "").trim();
  const returnPath = sanitizeNextPath(
    formData.get("returnPath"),
    `/admin/reports/${reportId}`,
  );
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer) {
    redirect("/login");
  }

  if (!supabase) {
    redirect(buildReviewRedirect(returnPath, "error", "Review tools are not available right now."));
  }

  if (!canReviewReportsRole(viewer.role)) {
    redirect(buildReviewRedirect(returnPath, "error", "Reviewer access is required."));
  }

  if (!reportId) {
    redirect("/admin/reports");
  }

  const { missingFeature, context } = await loadReviewContext(reportId, supabase);

  if (missingFeature) {
    redirect(buildReviewRedirect(returnPath, "error", buildMigrationMessage()));
  }

  if (!context) {
    redirect(buildReviewRedirect(returnPath, "error", "We could not find that report."));
  }

  if (!canViewerModerateContext(viewer, context)) {
    redirect(
      buildReviewRedirect(
        returnPath,
        "error",
        "That report is already assigned to another reviewer.",
      ),
    );
  }

  if (context.report.status === "resolved" || context.report.status === "dismissed") {
    redirect(
      buildReviewRedirect(
        returnPath,
        "error",
        "This review is already finished and archived.",
      ),
    );
  }

  if (!context.thread) {
    const { error: insertError } = await supabase
      .from("report_review_threads")
      .insert({
        report_id: context.report.id,
        lesson_plan_id: context.lesson.id,
        creator_id: context.lesson.author_id,
        reviewer_id: viewer.userId,
      });

    if (insertError) {
      redirect(
        buildReviewRedirect(
          returnPath,
          "error",
          isMissingReportReviewFeatureError(insertError)
            ? buildMigrationMessage()
            : insertError.message ?? "We could not open the creator review thread yet.",
        ),
      );
    }
  }

  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: "reviewing",
      assigned_reviewer_id: context.report.assigned_reviewer_id ?? viewer.userId,
    })
    .eq("id", context.report.id);

  if (updateError) {
    redirect(
      buildReviewRedirect(
        returnPath,
        "error",
        isMissingReportReviewFeatureError(updateError)
          ? buildMigrationMessage()
          : updateError.message ?? "We could not move that report into review.",
      ),
    );
  }

  revalidateReviewPaths(context, context.report.id);
  redirect(
    buildReviewRedirect(
      returnPath,
      "updated",
      "Creator review thread opened. You can now message the lesson author here.",
    ),
  );
}

export async function postReviewThreadMessageAction(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "").trim();
  const returnPath = sanitizeNextPath(
    formData.get("returnPath"),
    `/admin/reports/${reportId}`,
  );
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer) {
    redirect("/login");
  }

  if (!supabase || !reportId) {
    redirect(buildReviewRedirect(returnPath, "error", "Unable to send that message."));
  }

  if (!body) {
    redirect(buildReviewRedirect(returnPath, "error", "Write a short message first."));
  }

  const { missingFeature, context } = await loadReviewContext(reportId, supabase);

  if (missingFeature) {
    redirect(buildReviewRedirect(returnPath, "error", buildMigrationMessage()));
  }

  if (!context?.thread) {
    redirect(
      buildReviewRedirect(
        returnPath,
        "error",
        "Open the creator review thread before sending messages.",
      ),
    );
  }

  const canPostAsReviewer =
    canReviewReportsRole(viewer.role) &&
    (canManageUsersRole(viewer.role) ||
      context.thread.reviewer_id === viewer.userId);
  const canPostAsCreator = context.thread.creator_id === viewer.userId;

  if (!canPostAsReviewer && !canPostAsCreator) {
    redirect(
      buildReviewRedirect(
        returnPath,
        "error",
        "You do not have permission to post in this review thread.",
      ),
    );
  }

  const { error: insertError } = await supabase
    .from("report_review_messages")
    .insert({
      thread_id: context.thread.id,
      author_id: viewer.userId,
      body,
    });

  if (insertError) {
    redirect(
      buildReviewRedirect(
        returnPath,
        "error",
        isMissingReportReviewFeatureError(insertError)
          ? buildMigrationMessage()
          : insertError.message ?? "We could not send that message yet.",
      ),
    );
  }

  await supabase
    .from("report_review_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", context.thread.id);

  revalidateReviewPaths(context, context.report.id);
  redirect(buildReviewRedirect(returnPath, "updated", "Message sent."));
}

export async function completeReviewAction(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "").trim();
  const returnPath = sanitizeNextPath(
    formData.get("returnPath"),
    `/admin/reports/${reportId}`,
  );
  const outcome = String(formData.get("outcome") ?? "").trim() as ReportStatus;
  const resolutionNote = String(formData.get("resolutionNote") ?? "")
    .trim()
    .slice(0, 2000);
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer) {
    redirect("/login");
  }

  if (!supabase || !reportId) {
    redirect(buildReviewRedirect(returnPath, "error", "Unable to complete that review."));
  }

  if (outcome !== "resolved" && outcome !== "dismissed") {
    redirect(buildReviewRedirect(returnPath, "error", "Choose a valid review outcome."));
  }

  if (!canReviewReportsRole(viewer.role)) {
    redirect(buildReviewRedirect(returnPath, "error", "Reviewer access is required."));
  }

  const { missingFeature, context } = await loadReviewContext(reportId, supabase);

  if (missingFeature) {
    redirect(buildReviewRedirect(returnPath, "error", buildMigrationMessage()));
  }

  if (!context) {
    redirect(buildReviewRedirect(returnPath, "error", "We could not find that report."));
  }

  if (!canViewerModerateContext(viewer, context)) {
    redirect(
      buildReviewRedirect(
        returnPath,
        "error",
        "That report is already assigned to another reviewer.",
      ),
    );
  }

  const timestamp = new Date().toISOString();
  const finalNote =
    resolutionNote ||
    (outcome === "resolved"
      ? "Review completed and archived."
      : "Report dismissed and archived.");

  const { error: updateError } = await supabase
    .from("reports")
    .update({
      status: outcome,
      assigned_reviewer_id: context.report.assigned_reviewer_id ?? viewer.userId,
      reviewed_by: viewer.userId,
      reviewed_at: timestamp,
      resolution_note: finalNote,
      archived_at: timestamp,
      reporter_handle_snapshot: context.reporterHandle ?? "friend",
      creator_handle_snapshot:
        context.creatorHandle ?? context.lesson.author_handle ?? "friend",
      reviewer_handle_snapshot: viewer.handle,
    })
    .eq("id", context.report.id);

  if (updateError) {
    redirect(
      buildReviewRedirect(
        returnPath,
        "error",
        isMissingReportReviewFeatureError(updateError)
          ? buildMigrationMessage()
          : updateError.message ?? "We could not finish that review yet.",
      ),
    );
  }

  if (context.thread) {
    await supabase.from("report_review_threads").delete().eq("id", context.thread.id);
  }

  revalidateReviewPaths(context, context.report.id);
  redirect(
    buildReviewRedirect(
      "/admin/reports",
      "updated",
      outcome === "resolved"
        ? "Review finished. The conversation thread was removed and the report was archived."
        : "Report dismissed. The conversation thread was removed and the report was archived.",
    ),
  );
}
