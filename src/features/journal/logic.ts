/**
 * Journal logic (E-10, FR-8, US-20/21/22). Pure, so it is unit-tested.
 * Entries live only on the device (E-04 storage); nothing here sends data.
 */
import { JOURNAL_MAX_CHARS, MOODS, type JournalEntry, type Locale, type LocalDateKey, type Mood } from "@/lib/types";
import { parseDateKey } from "@/i18n/format";

/**
 * Content's mood keys (`content/en/journal.json`) mapped to the stored Mood
 * ids from the E-02 contract. The contract ids differ from Content's names,
 * so this map keeps stored data stable (CR-D2-02 asks to align them).
 * Order = display order.
 */
export const MOOD_CONTENT_KEY: Record<Mood, string> = {
  bright: "mood.peaceful",
  light: "mood.grateful",
  steady: "mood.okay",
  low: "mood.restless",
  heavy: "mood.heavy",
};
export const MOOD_ORDER: readonly Mood[] = ["bright", "light", "steady", "low", "heavy"];

const EPOCH = Date.UTC(2026, 0, 1);

/** Content rule: today's prompt = prompts[(local days since 2026-01-01) mod 30]. */
export function promptIndexFor(localDate: LocalDateKey, count = 30): number {
  if (count <= 0) return 0;
  const { y, m, d } = parseDateKey(localDate);
  const days = Math.round((Date.UTC(y, m - 1, d) - EPOCH) / 86_400_000);
  return ((days % count) + count) % count;
}

export type DraftError = "empty" | "too_long";

export function validateDraft(text: string): DraftError | null {
  if (text.trim().length === 0) return "empty";
  if (text.length > JOURNAL_MAX_CHARS) return "too_long";
  return null;
}

export function buildEntry(input: {
  id: string;
  text: string;
  mood: Mood | null;
  promptId: string | null;
  locale: Locale;
  localDate: LocalDateKey;
  now: number;
}): JournalEntry {
  const err = validateDraft(input.text);
  if (err) throw new Error(err);
  if (input.mood !== null && !(MOODS as readonly string[]).includes(input.mood)) throw new Error("unknown mood");
  return {
    v: 1,
    id: input.id,
    createdAt: input.now,
    updatedAt: input.now,
    localDate: input.localDate,
    mood: input.mood,
    text: input.text.trim(),
    promptId: input.promptId,
    locale: input.locale,
  };
}

export interface ExportLabels {
  header: string;
  formatDate: (e: JournalEntry) => string;
  promptLine: (promptId: string) => string | null;
  moodLine: (mood: Mood) => string;
}

/** Plain-text export (US-22): every entry with date, prompt, mood and text, oldest first. */
export function journalToText(entries: readonly JournalEntry[], l: ExportLabels): string {
  const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
  const blocks = sorted.map((e) => {
    const lines = [l.formatDate(e)];
    const p = e.promptId ? l.promptLine(e.promptId) : null;
    if (p) lines.push(p);
    if (e.mood) lines.push(l.moodLine(e.mood));
    lines.push("", e.text);
    return lines.join("\n");
  });
  return [l.header, "", ...blocks.flatMap((b) => [b, "", "---", ""])].join("\n").replace(/\n---\n\n$/, "\n");
}

/** JSON export: the stored records plus readable prompt text and mood labels. */
export function journalToJson(
  entries: readonly JournalEntry[],
  promptText: (id: string) => string | null,
  moodLabel: (m: Mood) => string,
  exportedAt: string,
): string {
  const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
  return JSON.stringify(
    {
      app: "pranadin",
      exportVersion: 1,
      exportedAt,
      entries: sorted.map((e) => ({
        ...e,
        promptText: e.promptId ? promptText(e.promptId) : null,
        moodLabel: e.mood ? moodLabel(e.mood) : null,
      })),
    },
    null,
    2,
  );
}

export const exportFileName = (localDate: LocalDateKey, ext: "txt" | "json") => `pranadin-journal-${localDate}.${ext}`;
