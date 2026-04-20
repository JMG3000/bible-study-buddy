"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentViewer } from "@/lib/lesson-plans";
import { sanitizeNextPath } from "@/lib/urls";

export async function removeSavedPlanAction(formData: FormData) {
  const lessonPlanId = formData.get("lessonPlanId");
  const lessonPath = sanitizeNextPath(formData.get("lessonPath"), "/dashboard/saved");
  const viewer = await getCurrentViewer();
  const supabase = await createSupabaseServerClient();

  if (!viewer || !supabase || typeof lessonPlanId !== "string" || lessonPlanId.length === 0) {
    redirect("/dashboard/saved");
  }

  await supabase
    .from("favorites")
    .delete()
    .eq("user_id", viewer.userId)
    .eq("lesson_plan_id", lessonPlanId);

  revalidatePath("/dashboard/saved");
  revalidatePath(lessonPath);
  redirect("/dashboard/saved");
}
