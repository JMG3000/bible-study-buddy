import "server-only";

type LessonContentForReview = {
  title: string;
  summary: string;
  teachingObjective: string;
  openingPrayer?: string | null;
  icebreaker?: string | null;
  facilitatorNotes?: string | null;
  discussionQuestions?: string[];
  activities?: string[];
  prayerPrompts?: string[];
  customTags?: string[];
};

export type ContentReviewResult = {
  approved: boolean;
  provider: "openai" | "heuristic";
  reason?: string;
};

const REVIEW_BLOCK_MESSAGE =
  "This lesson needs a quick manual review before it can be published.";

const HEURISTIC_PATTERNS = [
  /\b(fuck|fucking|shit|bullshit|bitch|asshole|bastard)\b/i,
  /\b(sexually explicit|porn|pornographic)\b/i,
  /\b(rape|molest|molestation)\b/i,
];

function buildReviewText(input: LessonContentForReview) {
  return [
    input.title,
    input.summary,
    input.teachingObjective,
    input.openingPrayer ?? "",
    input.icebreaker ?? "",
    input.facilitatorNotes ?? "",
    ...(input.discussionQuestions ?? []),
    ...(input.activities ?? []),
    ...(input.prayerPrompts ?? []),
    ...(input.customTags ?? []),
  ]
    .join("\n")
    .trim();
}

function runHeuristicReview(text: string): ContentReviewResult {
  const flagged = HEURISTIC_PATTERNS.some((pattern) => pattern.test(text));

  if (flagged) {
    return {
      approved: false,
      provider: "heuristic",
      reason: REVIEW_BLOCK_MESSAGE,
    };
  }

  return {
    approved: true,
    provider: "heuristic",
  };
}

export async function reviewLessonContent(
  input: LessonContentForReview,
): Promise<ContentReviewResult> {
  const text = buildReviewText(input);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!text) {
    return {
      approved: true,
      provider: apiKey ? "openai" : "heuristic",
    };
  }

  if (!apiKey) {
    return runHeuristicReview(text);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "omni-moderation-latest",
        input: text,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return runHeuristicReview(text);
    }

    const payload = (await response.json()) as {
      results?: Array<{ flagged?: boolean }>;
    };
    const flagged = payload.results?.[0]?.flagged;

    if (typeof flagged !== "boolean") {
      return runHeuristicReview(text);
    }

    if (flagged) {
      return {
        approved: false,
        provider: "openai",
        reason: REVIEW_BLOCK_MESSAGE,
      };
    }

    return {
      approved: true,
      provider: "openai",
    };
  } catch {
    return runHeuristicReview(text);
  }
}
