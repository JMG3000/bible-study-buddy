import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

const SLACK_SIGNATURE_VERSION = "v0";
const SLACK_REPLAY_WINDOW_SECONDS = 60 * 5;

export type DevopsCommand =
  | "help"
  | "status"
  | "validate"
  | "deploy-preview"
  | "promote-production";

export interface SlackDevopsRequest {
  channelId: string;
  userId: string;
  text: string;
  responseUrl?: string;
}

export function verifySlackSignature({
  body,
  signature,
  timestamp,
}: {
  body: string;
  signature: string | null;
  timestamp: string | null;
}) {
  if (!env.slackSigningSecret || !signature || !timestamp) {
    return false;
  }

  const timestampNumber = Number.parseInt(timestamp, 10);

  if (
    !Number.isFinite(timestampNumber) ||
    Math.abs(Date.now() / 1000 - timestampNumber) > SLACK_REPLAY_WINDOW_SECONDS
  ) {
    return false;
  }

  const baseString = `${SLACK_SIGNATURE_VERSION}:${timestamp}:${body}`;
  const expectedSignature = `${SLACK_SIGNATURE_VERSION}=${createHmac(
    "sha256",
    env.slackSigningSecret,
  )
    .update(baseString)
    .digest("hex")}`;

  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

export function isAllowedSlackRequester({
  channelId,
  userId,
}: Pick<SlackDevopsRequest, "channelId" | "userId">) {
  const allowedUsers = env.slackAllowedUserIds
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (env.slackAllowedChannelId && channelId !== env.slackAllowedChannelId) {
    return false;
  }

  return allowedUsers.length === 0 || allowedUsers.includes(userId);
}

export function parseDevopsCommand(text: string): {
  command: DevopsCommand;
  args: string[];
} {
  const [rawCommand = "help", ...args] = text.trim().split(/\s+/);
  const normalizedCommand = rawCommand.toLowerCase();
  const allowedCommands = new Set<DevopsCommand>([
    "help",
    "status",
    "validate",
    "deploy-preview",
    "promote-production",
  ]);

  if (allowedCommands.has(normalizedCommand as DevopsCommand)) {
    return { command: normalizedCommand as DevopsCommand, args };
  }

  return { command: "help", args: [] };
}

export function buildDevopsStatusMessage() {
  return [
    "*Bible Study Buddy DevOps status*",
    "- CodeQL: disabled, not a promotion gate",
    "- GitHub Actions: automatic triggers paused; manual dispatch only",
    "- CircleCI: build verification source",
    "- CodeRabbit: review source for PR/diff checks",
    "- Vercel: deployment and preview verification source",
    "- Supabase: schema, RLS, and integration verification source",
    "- Meticulous: Vercel preview recorder path",
    `- Slack channel: ${env.slackAllowedChannelId || "not configured"}`,
  ].join("\n");
}

export function buildHelpMessage() {
  return [
    "*Bible Study Buddy DevOps commands*",
    "`status` - show configured verification sources",
    "`validate` - trigger CircleCI validation for `dev-test`",
    "`deploy-preview` - call the configured Vercel preview deploy hook",
    "`promote-production confirm` - call the configured Vercel production deploy hook",
    "",
    "Production promotion requires the exact `confirm` argument.",
  ].join("\n");
}

export async function triggerCircleCiValidation() {
  if (!env.circleciApiToken || !env.circleciProjectSlug) {
    return {
      ok: false,
      message:
        "CircleCI trigger is not configured. Set CIRCLECI_API_TOKEN and CIRCLECI_PROJECT_SLUG.",
    };
  }

  const response = await fetch(
    `https://circleci.com/api/v2/project/${env.circleciProjectSlug}/pipeline`,
    {
      method: "POST",
      headers: {
        "Circle-Token": env.circleciApiToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: "dev-test",
        parameters: {
          requested_by_slack: true,
        },
      }),
    },
  );

  if (!response.ok) {
    return {
      ok: false,
      message: `CircleCI trigger failed with HTTP ${response.status}.`,
    };
  }

  return {
    ok: true,
    message: "CircleCI validation requested for `dev-test`.",
  };
}

export async function triggerVercelDeployHook({
  production,
}: {
  production: boolean;
}) {
  const hookUrl = production
    ? env.vercelProductionDeployHookUrl
    : env.vercelPreviewDeployHookUrl;

  if (!hookUrl) {
    return {
      ok: false,
      message: production
        ? "Production deploy hook is not configured."
        : "Preview deploy hook is not configured.",
    };
  }

  const response = await fetch(hookUrl, { method: "POST" });

  if (!response.ok) {
    return {
      ok: false,
      message: `Vercel deploy hook failed with HTTP ${response.status}.`,
    };
  }

  return {
    ok: true,
    message: production
      ? "Production deploy hook accepted."
      : "Preview deploy hook accepted.",
  };
}

export async function postDevopsBroadcast(message: string) {
  if (!env.slackBroadcastWebhookUrl) {
    return;
  }

  await fetch(env.slackBroadcastWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: message }),
  });
}
