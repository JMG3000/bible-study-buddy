"use client";

import Script from "next/script";
import { env } from "@/lib/env";

export function ScriptureTooltipEnhancer() {
  if (
    env.scriptureTooltipMode === "off" ||
    !env.scriptureTooltipScript.trim()
  ) {
    return null;
  }

  return (
    <Script
      src={env.scriptureTooltipScript}
      strategy="afterInteractive"
      data-mode={env.scriptureTooltipMode}
    />
  );
}
