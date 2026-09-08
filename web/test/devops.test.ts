import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isAllowedSlackRequester,
  verifySlackSignature,
} from "@/lib/devops";
import { env } from "@/lib/env";

const originalSlackEnv = {
  slackSigningSecret: env.slackSigningSecret,
  slackAllowedChannelId: env.slackAllowedChannelId,
  slackAllowedUserIds: env.slackAllowedUserIds,
};

function signSlackBody(body: string, timestamp: string, secret: string) {
  return `v0=${createHmac("sha256", secret)
    .update(`v0:${timestamp}:${body}`)
    .digest("hex")}`;
}

describe("Slack DevOps authorization", () => {
  beforeEach(() => {
    env.slackSigningSecret = "test-signing-secret";
    env.slackAllowedChannelId = "C-allowed";
    env.slackAllowedUserIds = "U-allowed,U-backup";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });

  afterEach(() => {
    Object.assign(env, originalSlackEnv);
    vi.useRealTimers();
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
});
