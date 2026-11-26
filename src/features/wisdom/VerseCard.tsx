"use client";

import { useState } from "react";
import { Mandala } from "@/components/Mandala";
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
    <section aria-labelledby="verse-title" data-verse-id={v.id} className="relative isolate overflow-hidden rounded-2xl border border-divider shadow-elev-1 bg-[var(--card-bg)] p-4">
      <Mandala className="absolute -bottom-10 -right-10 -z-10 h-36 w-36 text-[var(--accent)] opacity-25" />
      <h2 id="verse-title" className="text-h3">
        {s("wisdom.title")}
      </h2>
      <p className="text-small text-text-muted">{s(`wisdom.tradition.${v.tradition}`)}</p>
      <p lang={v.script.lang} className="mt-3 whitespace-pre-line text-lg leading-8">
        {v.script.text}
      </p>
      {v.transliteration && <p lang={`${v.script.lang}-Latn`} className="mt-2 whitespace-pre-line italic text-text-muted">{v.transliteration}</p>}
      <p className="mt-3 text-small font-semibold text-text-muted">{s("wisdom.meaning")}</p>
      <p lang={v.meaning.lang}>{v.meaning.text}</p>
      {v.note && (
        <p className="mt-2 text-small text-text-muted" lang={v.note.lang}>
          {v.note.text}
        </p>
      )}
      <p className="mt-3 font-semibold">
        {v.by ? `${s("wisdom.by", { name: v.by })}, ` : ""}
        {v.work} {v.reference}
      </p>
      <p className="text-small text-text-muted">{s("wisdom.paraphrase")}</p>
      <details className="mt-2 text-small">
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
      <div className="mt-2">
        <button type="button" className={btn.secondary} onClick={() => void share()}>
          {s("wisdom.share")}
        </button>
      </div>
      <p role="status" aria-live="polite" className={msg ? "mt-2 rounded-md bg-success-tint p-3" : "sr-only"}>
        {msg ?? ""}
      </p>
    </section>
  );
}
