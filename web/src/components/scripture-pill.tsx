import Link from "next/link";
import type { ScriptureRef } from "@/lib/types";

function buildBibleGatewayUrl(scripture: ScriptureRef) {
  return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(scripture.displayLabel)}`;
}

export function ScripturePill({ scripture }: { scripture: ScriptureRef }) {
  return (
    <Link
      href={buildBibleGatewayUrl(scripture)}
      target="_blank"
      rel="noreferrer"
      className="chip"
      data-scripture-ref={scripture.displayLabel}
    >
      {scripture.displayLabel}
    </Link>
  );
}
