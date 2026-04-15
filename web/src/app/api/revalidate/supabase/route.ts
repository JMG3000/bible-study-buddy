import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  HOME_TAG,
  PLAN_LIST_TAG,
  lessonPlanPath,
  lessonPlanTag,
} from "@/lib/revalidation";

interface WebhookPayload {
  type?: string;
  record?: {
    id?: string;
    slug?: string | null;
    status?: string | null;
  };
  old_record?: {
    slug?: string | null;
    status?: string | null;
  };
}

export async function POST(request: NextRequest) {
  const secret =
    request.headers.get("x-webhook-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!env.webhookSecret || secret !== env.webhookSecret) {
    return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as WebhookPayload;
  const planId = payload.record?.id;
  const slug = payload.record?.slug ?? payload.old_record?.slug;
  const status = payload.record?.status ?? payload.old_record?.status;

  revalidateTag(HOME_TAG, { expire: 0 });
  revalidateTag(PLAN_LIST_TAG, { expire: 0 });

  if (planId) {
    revalidateTag(lessonPlanTag(planId), { expire: 0 });
  }

  if (slug) {
    revalidatePath(lessonPlanPath(slug));
  }

  if (status === "published" || status === "unpublished") {
    revalidatePath("/plans");
    revalidatePath("/");
  }

  return Response.json({
    ok: true,
    planId,
    slug,
    status,
    event: payload.type ?? "unknown",
  });
}
