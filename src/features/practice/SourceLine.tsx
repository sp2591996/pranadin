"use client";

import type { PracticeSource } from "@/features/shared/content.server";
import { useS } from "@/features/shared/strings";

/**
 * Visible source line on technique and meditation pages (QA-21, US-26).
 * The source text is English by design (a document title); the label is a UI string.
 */
export function SourceLine({ source }: { source: PracticeSource | null }) {
  const s = useS();
  if (!source) return null;
  return (
    <p className="text-[0.875rem] leading-5 text-text-muted">
      {s("practice.source")}:{" "}
      {source.url ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-2">
          <span lang="en">{source.name}</span>
          <span className="sr-only"> ({s("a11y.opensOutside")})</span>
        </a>
      ) : (
        <span lang="en">{source.name}</span>
      )}
    </p>
  );
}
