import { NextResponse } from "next/server";
import {
  DuplicateLessonError,
  duplicateLessonToDraft,
} from "@/lib/duplicate-lessons";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const sourceLessonId = id.trim();
  const supabase = await createSupabaseServerClient();

  if (!sourceLessonId) {
    return NextResponse.json({ error: "Missing lesson id." }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: "Lesson duplication is not available right now." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in to duplicate lessons." }, { status: 401 });
  }

  try {
    const draft = await duplicateLessonToDraft({
      supabase,
      sourceLessonId,
      userId: user.id,
    });

    return NextResponse.json({
      id: draft.id,
      editorPath: `/dashboard/plans/${draft.id}`,
    });
  } catch (error) {
    if (error instanceof DuplicateLessonError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "We could not duplicate that lesson yet." },
      { status: 500 },
    );
  }
}
