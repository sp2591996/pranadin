"use client";

import { useState } from "react";
import { Mandala } from "@/components/Mandala";
import { useS } from "@/features/shared/strings";
import type { PlaceView } from "./types";

/**
 * Photo gallery (D-032). Every AI image shows the visible "AI-generated image" caption.
 * A real photo shows its credit line instead (set `ai: false` and `credit` in the content file).
 * With no photo yet, a quiet Mandala placeholder is shown.
 */
export function Gallery({ placeId, photos }: { placeId: string; photos: PlaceView["photos"] }) {
  const s = useS();
  const [i, setI] = useState(0);
  if (photos.length === 0) {
    return (
      <figure className="relative isolate flex aspect-square max-h-72 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-[var(--card-border)] bg-[var(--card-hero-bg)]">
        <Mandala className="h-40 w-40 text-[var(--accent)] opacity-40" />
        <figcaption className="absolute bottom-2 start-3 end-3 text-center text-small text-text-muted">{s("yatra.noPhoto")}</figcaption>
      </figure>
    );
  }
  const p = photos[Math.min(i, photos.length - 1)]!;
  return (
    <div className="flex flex-col gap-2" data-testid="gallery">
      <figure className="mx-auto w-full max-w-[420px]">
        {/* Static export with unoptimised images: a plain img keeps the file we ship. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/yatra/${placeId}/${p.file}`}
          alt={p.caption.text}
          lang={p.caption.lang}
          width={1024}
          height={1024}
          loading="eager"
          className="h-auto w-full rounded-lg border border-divider bg-surface-2"
        />
        <figcaption className="mt-1 text-center text-[0.875rem] leading-5 text-text-muted">
          <span lang={p.caption.lang}>{p.caption.text}</span>
          {" · "}
          {p.ai ? <span data-testid="ai-caption">{s("yatra.aiImage")}</span> : <span data-testid="photo-credit">{s("yatra.photoCredit", { credit: p.credit })}</span>}
        </figcaption>
      </figure>
      {photos.length > 1 ? (
        <div role="group" aria-label={s("yatra.gallery")} className="flex flex-wrap justify-center gap-2">
          {photos.map((x, k) => (
            <button
              key={x.file}
              type="button"
              aria-pressed={k === i}
              onClick={() => setI(k)}
              className="min-h-11 min-w-11 rounded-full border border-border-input px-3 aria-[pressed=true]:border-primary aria-[pressed=true]:bg-primary-tint"
            >
              {k + 1}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
