import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/devops/slack/route";
import {
  isAllowedSlackRequester,
  verifySlackSignature,
} from "@/lib/devops";
import { env } from "@/lib/env";

const originalSlackEnv = {
  slackSigningSecret: env.slackSigningSecret,
  slackAllowedChannelId: env.slackAllowedChannelId,
  slackAllowedUserIds: env.slackAllowedUserIds,
  slackBroadcastWebhookUrl: env.slackBroadcastWebhookUrl,
  circleciApiToken: env.circleciApiToken,
  circleciProjectSlug: env.circleciProjectSlug,
  vercelPreviewDeployHookUrl: env.vercelPreviewDeployHookUrl,
};

function signSlackBody(body: string, timestamp: string, secret: string) {
  return `v0=${createHmac("sha256", secret)
    .update(`v0:${timestamp}:${body}`)
    .digest("hex")}`;
}

function signedSlackRequest(text: string) {
  const body = new URLSearchParams({
    channel_id: "C-allowed",
    user_id: "U-allowed",
    text,
  }).toString();
  const timestamp = String(Date.now() / 1000);

  return new Request("https://example.com/api/devops/slack", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-slack-request-timestamp": timestamp,
      "x-slack-signature": signSlackBody(
        body,
        timestamp,
        env.slackSigningSecret!,
      ),
    },
    body,
  }) as NextRequest;
}

describe("Slack DevOps authorization", () => {
  beforeEach(() => {
    env.slackSigningSecret = "test-signing-secret";
    env.slackAllowedChannelId = "C-allowed";
    env.slackAllowedUserIds = "U-allowed,U-backup";
    env.slackBroadcastWebhookUrl = undefined;
    env.circleciApiToken = "test-circleci-token";
    env.circleciProjectSlug = "gh/JMG3000/bible-study-buddy";
    env.vercelPreviewDeployHookUrl = "https://example.com/vercel-preview";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    Object.assign(env, originalSlackEnv);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("accepts a correctly signed request inside the replay window", () => {
    const body = "command=%2Fbsb-devops&text=status";
    const timestamp = String(Date.now() / 1000);

    expect(
      verifySlackSignature({
        body,
        timestamp,
        signature: signSlackBody(body, timestamp, env.slackSigningSecret!),
      }),
    ).toBe(true);
  });

  it("rejects a correctly signed request outside the replay window", () => {
    const body = "command=%2Fbsb-devops&text=status";
    const timestamp = String(Date.now() / 1000 - 301);

    expect(
      verifySlackSignature({
        body,
        timestamp,
        signature: signSlackBody(body, timestamp, env.slackSigningSecret!),
      }),
    ).toBe(false);
  });

  it("requires both an allowed channel and an allowed user", () => {
    expect(
      isAllowedSlackRequester({
        channelId: "C-allowed",
        userId: "U-allowed",
      }),
    ).toBe(true);
    expect(
      isAllowedSlackRequester({
        channelId: "C-other",
        userId: "U-allowed",
      }),
    ).toBe(false);
    expect(
      isAllowedSlackRequester({
        channelId: "C-allowed",
        userId: "U-other",
      }),
    ).toBe(false);
  });

  it("does not authorize production deployment from a signed Slack command", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    const response = await POST(signedSlackRequest("promote-production confirm"));
    const payload = (await response.json()) as { text: string };

    expect(response.status).toBe(200);
    expect(payload.text).toContain("Bible Study Buddy DevOps commands");
    expect(payload.text).not.toContain("promote-production");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retains signed preview deployment requests", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    const response = await POST(signedSlackRequest("deploy-preview"));
    const payload = (await response.json()) as { text: string };

    expect(response.status).toBe(200);
    expect(payload.text).toBe("Preview deploy hook accepted.");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("https://example.com/vercel-preview", {
      method: "POST",
    });
  });

  it("retains signed CircleCI validation requests", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    const response = await POST(signedSlackRequest("validate"));
    const payload = (await response.json()) as { text: string };

    expect(response.status).toBe(200);
    expect(payload.text).toBe("CircleCI validation requested for `dev-test`.");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "https://circleci.com/api/v2/project/gh/JMG3000/bible-study-buddy/pipeline",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
