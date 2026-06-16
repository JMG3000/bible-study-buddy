import type { NextRequest } from "next/server";
import {
  buildDevopsStatusMessage,
  buildHelpMessage,
  isAllowedSlackRequester,
  parseDevopsCommand,
  postDevopsBroadcast,
  triggerCircleCiValidation,
  triggerVercelDeployHook,
  verifySlackSignature,
} from "@/lib/devops";

export const runtime = "nodejs";

function slackResponse(text: string, status = 200) {
  return Response.json(
    {
      response_type: "ephemeral",
      text,
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-slack-signature");
  const timestamp = request.headers.get("x-slack-request-timestamp");

  if (!verifySlackSignature({ body, signature, timestamp })) {
    return slackResponse("Unauthorized Slack request.", 401);
  }

  const formData = new URLSearchParams(body);
  const channelId = formData.get("channel_id") ?? "";
  const userId = formData.get("user_id") ?? "";
  const text = formData.get("text") ?? "";
  const responseUrl = formData.get("response_url") ?? undefined;

  if (!isAllowedSlackRequester({ channelId, userId })) {
    return slackResponse("This Slack channel or user is not allowed.", 403);
  }

  const { command, args } = parseDevopsCommand(text);

  if (command === "status") {
    return slackResponse(buildDevopsStatusMessage());
  }

  if (command === "validate") {
    const result = await triggerCircleCiValidation();
    const message = result.ok ? result.message : `Validation request failed: ${result.message}`;
    await postDevopsBroadcast(
      `Bible Study Buddy Slack DevOps command: \`validate\` by <@${userId}>. ${message}`,
    );
    return slackResponse(message, result.ok ? 200 : 500);
  }

  if (command === "deploy-preview") {
    const result = await triggerVercelDeployHook({ production: false });
    const message = result.ok ? result.message : `Preview deploy request failed: ${result.message}`;
    await postDevopsBroadcast(
      `Bible Study Buddy Slack DevOps command: \`deploy-preview\` by <@${userId}>. ${message}`,
    );
    return slackResponse(message, result.ok ? 200 : 500);
  }

  if (command === "promote-production") {
    if (args[0] !== "confirm") {
      return slackResponse(
        "Production promotion requires `promote-production confirm`.",
        400,
      );
    }

    const result = await triggerVercelDeployHook({ production: true });
    const message = result.ok
      ? result.message
      : `Production promotion request failed: ${result.message}`;
    await postDevopsBroadcast(
      `Bible Study Buddy Slack DevOps command: \`promote-production confirm\` by <@${userId}>. ${message}`,
    );
    return slackResponse(message, result.ok ? 200 : 500);
  }

  if (responseUrl) {
    await postDevopsBroadcast(
      `Bible Study Buddy Slack DevOps command help requested by <@${userId}>.`,
    );
  }

  return slackResponse(buildHelpMessage());
}
