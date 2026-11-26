"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { useLocalDay } from "@/components/useLocalDay";
import { useS } from "@/features/shared/strings";
import { btn } from "@/features/shared/ui";
import { pickVerseIndex } from "./pick";
import type { VerseView } from "./types";

/** Plain text used by Share and Copy. */
export function verseShareText(v: VerseView): string {
  const parts = [v.script.text, v.transliteration, v.meaning.text, `${v.by ? `${v.by}, ` : ""}${v.work} ${v.reference}`, "PranaDin"];
  return parts.filter(Boolean).join("\n\n");
}

/**
 * Verse of the day (FR wisdom, D-026 Wave C). Pre-rendered for the build date,
 * then switches to the device's local day. Share uses navigator.share when
 * present, else copies to the clipboard.
 */
export function VerseCard({ verses, buildDate }: { verses: VerseView[]; buildDate: string }) {
  const s = useS();
  const { dateKey } = useLocalDay(buildDate);
  const [msg, setMsg] = useState<string | null>(null);
  const v = verses[pickVerseIndex(dateKey, verses.length)];
  if (!v) return null;

  async function share() {
    if (!v) return;
    const text = verseShareText(v);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: s("wisdom.title"), text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setMsg(s("wisdom.copied"));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return; // user closed the share sheet
      setMsg(s("wisdom.shareFailed"));
    }
  }

  return (
    <section aria-labelledby="verse-title" data-verse-id={v.id} className="paper-texture relative overflow-hidden rounded-[var(--r-xl)] border border-divider bg-surface p-6 shadow-elev-1 sm:p-9">
      <span aria-hidden="true" className="absolute right-6 top-5 font-deva text-2xl text-accent/70 sm:right-8 sm:top-7">
        ॥
      </span>
      <h2 id="verse-title" className="eyebrow flex items-center gap-2 font-sans text-primary">
        <Icon name="Quotes" size={16} />
        {s("wisdom.title")}
      </h2>
      <p className="mt-1 text-small text-text-muted">{s(`wisdom.tradition.${v.tradition}`)}</p>
      <p lang={v.script.lang} className="mt-4 whitespace-pre-line font-deva text-[1.375rem] leading-9 text-text sm:text-[1.5rem]">
        {v.script.text}
      </p>
      {v.transliteration && <p lang={`${v.script.lang}-Latn`} className="mt-3 whitespace-pre-line font-display text-[1.125rem] italic text-text-muted">{v.transliteration}</p>}
      <p className="mt-4 text-caption font-semibold uppercase tracking-wider text-text-muted">{s("wisdom.meaning")}</p>
      <p lang={v.meaning.lang} className="mt-1 text-body-lg text-text">
        “{v.meaning.text}”
      </p>
      {v.note && (
        <p className="mt-2 text-small text-text-muted" lang={v.note.lang}>
          {v.note.text}
        </p>
      )}
      <p className="mt-4 text-small font-semibold uppercase tracking-wider text-primary">
        — {v.by ? `${s("wisdom.by", { name: v.by })}, ` : ""}
        {v.work} {v.reference}
      </p>
      <p className="mt-1 text-small text-text-muted">{s("wisdom.paraphrase")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
      <details className="text-small">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-primary">{s("wisdom.sources")}</summary>
        <ul className="flex flex-col">
          {v.sources.map((src) => (
            <li key={src.url}>
              <a href={src.url} target="_blank" rel="noopener noreferrer" lang="en" className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
                {src.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
        <button type="button" className={btn.ghost} onClick={() => void share()}>
          {s("wisdom.share")}
        </button>
      </div>
      <p role="status" aria-live="polite" className={msg ? "mt-2 rounded-md bg-success-tint p-3" : "sr-only"}>
        {msg ?? ""}
      </p>
    </section>
  );
}
