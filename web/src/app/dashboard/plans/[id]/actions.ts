"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  HOME_TAG,
  PLAN_LIST_TAG,
  lessonPlanPath,
} from "@/lib/revalidation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import { appendMessage, slugifyText } from "@/lib/urls";

function buildPlanRedirect(id: string, messageKey: string, message: string) {
  return appendMessage(`/dashboard/plans/${id}`, messageKey, message);
}

async function resolveUniqueSlug(
  baseTitle: string,
  lessonPlanId: string,
) {
  const serviceClient = createSupabaseServiceClient();
  const baseSlug = slugifyText(baseTitle);

  if (!serviceClient) {
    return baseSlug;
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data } = await serviceClient
      .from("lesson_plans")
      .select("id")
      .eq("slug", candidate)
      .neq("id", lessonPlanId)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function publishLessonAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Supabase is not configured in this environment.",
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/plans/${id}`)}`);
  }

  const { data: plan, error: planError } = await supabase
    .from("lesson_plans")
    .select("id, author_id, title, summary, teaching_objective, status, slug")
    .eq("id", id)
    .maybeSingle();

  if (planError || !plan) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        planError?.message ?? "We could not find that draft.",
      ),
    );
  }

  if (plan.author_id !== user.id) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Only the lesson owner can publish this draft.",
      ),
    );
  }

  if (!plan.title?.trim() || !plan.summary?.trim() || !plan.teaching_objective?.trim()) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        "Add a title, summary, and teaching objective before publishing.",
      ),
    );
  }

  const { count: scriptureCount, error: scriptureError } = await supabase
    .from("scripture_refs")
    .select("id", { count: "exact", head: true })
    .eq("lesson_plan_id", id);

  if (scriptureError || !scriptureCount) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        scriptureError?.message ??
          "Add at least one scripture reference before publishing.",
      ),
    );
  }

  const slug = await resolveUniqueSlug(plan.title, id);
  const { data: updatedPlan, error: updateError } = await supabase
    .from("lesson_plans")
    .update({
      status: "published",
      slug,
    })
    .eq("id", id)
    .select("slug")
    .single();

  if (updateError || !updatedPlan?.slug) {
    redirect(
      buildPlanRedirect(
        id,
        "error",
        updateError?.message ?? "We could not publish that draft yet.",
      ),
    );
  }

  revalidateTag(HOME_TAG, { expire: 0 });
  revalidateTag(PLAN_LIST_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/plans");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/plans/${id}`);
  revalidatePath(lessonPlanPath(updatedPlan.slug));

  redirect(
    appendMessage(`/dashboard/plans/${id}`, "published", updatedPlan.slug),
  );
}
