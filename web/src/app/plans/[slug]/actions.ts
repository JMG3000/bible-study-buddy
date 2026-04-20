"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  POST_AUTH_REDIRECT_COOKIE,
  sanitizeNextPath,
} from "@/lib/urls";
import { getCurrentViewer } from "@/lib/lesson-plans";

function getRedirectCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.siteUrl.startsWith("https://"),
    maxAge: 60 * 10,
  };
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
