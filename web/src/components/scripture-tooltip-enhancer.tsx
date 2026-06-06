"use client";

import Script from "next/script";
import { env } from "@/lib/env";

export function ScriptureTooltipEnhancer({ nonce }: { nonce?: string }) {
  if (
    env.scriptureTooltipMode === "off" ||
    !env.scriptureTooltipScript.trim()
  ) {
    return null;
  }

  return (
    <Script
      src={env.scriptureTooltipScript}
      nonce={nonce}
      strategy="afterInteractive"
      data-mode={env.scriptureTooltipMode}
    />
  );
}
