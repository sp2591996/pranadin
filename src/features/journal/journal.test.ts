import { describe, expect, it } from "vitest";
import { MOODS, type JournalEntry } from "@/lib/types";
import { MemoryRepo } from "@/lib/storage/repos";
import { journalSpec } from "@/lib/storage/schema";
import { buildEntry, journalToJson, journalToText, MOOD_CONTENT_KEY, MOOD_ORDER, promptIndexFor, validateDraft } from "./logic";

const base = { id: "a", mood: null, promptId: null, locale: "en" as const, localDate: "2026-11-17", now: 1000 };

describe("today's prompt (Content rule)", () => {
  it("is days since 2026-01-01 mod 30", () => {
    expect(promptIndexFor("2026-01-01")).toBe(0);
    expect(promptIndexFor("2026-01-30")).toBe(29);
    expect(promptIndexFor("2026-01-31")).toBe(0);
    expect(promptIndexFor("2026-11-17")).toBe(320 % 30);
    expect(promptIndexFor("2025-12-31")).toBe(29); // before the epoch stays in range
  });
});

describe("journal drafts (FR-8.1)", () => {
  it("rejects empty and over-long text", () => {
    expect(validateDraft("   ")).toBe("empty");
    expect(validateDraft("x".repeat(1000))).toBeNull();
    expect(validateDraft("x".repeat(1001))).toBe("too_long");
  });

  it("builds a valid stored record that passes the E-04 validator", async () => {
    const e = buildEntry({ ...base, text: "  okay today  ", mood: "okay", promptId: "prompt.01" });
    expect(e).toMatchObject({ v: 1, text: "okay today", mood: "okay", createdAt: 1000, updatedAt: 1000 });
    const repo = new MemoryRepo<JournalEntry>(journalSpec);
    await repo.put(e);
    expect(await repo.count()).toBe(1);
  });

  it("maps every content mood to a contract mood id", () => {
    expect(new Set(MOOD_ORDER)).toEqual(new Set(MOODS));
    expect(Object.keys(MOOD_CONTENT_KEY).sort()).toEqual([...MOODS].sort());
  });
});

describe("list and delete (US-21)", () => {
  it("lists newest first and deletes by id", async () => {
    const repo = new MemoryRepo<JournalEntry>(journalSpec);
    await repo.put(buildEntry({ ...base, id: "old", text: "one", now: 1 }));
    await repo.put(buildEntry({ ...base, id: "new", text: "two", now: 2 }));
    expect((await repo.list()).map((e) => e.id)).toEqual(["new", "old"]);
    await repo.delete("new");
    expect((await repo.list()).map((e) => e.id)).toEqual(["old"]);
  });
});

describe("export (US-22)", () => {
  const entries = [
    buildEntry({ ...base, id: "2", text: "second, with a comma", mood: "heavy", promptId: "prompt.02", now: 2000, localDate: "2026-11-18" }),
    buildEntry({ ...base, id: "1", text: "first", mood: null, promptId: null, now: 1000 }),
  ];
  const labels = {
    header: "PranaDin journal",
    formatDate: (e: JournalEntry) => e.localDate,
    promptLine: (id: string) => (id === "prompt.02" ? "Prompt: What are you grateful for?" : null),
    moodLine: (m: string) => `Mood: ${m === "heavy" ? "Heavy" : m}`,
  };

  it("text export has every entry, oldest first, with date, prompt, mood and text", () => {
    const txt = journalToText(entries, labels);
    expect(txt.indexOf("first")).toBeLessThan(txt.indexOf("second"));
    expect(txt).toContain("2026-11-18\nPrompt: What are you grateful for?\nMood: Heavy\n\nsecond, with a comma");
    expect(txt.startsWith("PranaDin journal")).toBe(true);
  });

  it("JSON export round-trips the records", () => {
    const parsed = JSON.parse(journalToJson(entries, () => "P", () => "M", "2026-11-17")) as { entries: JournalEntry[] };
    expect(parsed.entries.map((e) => e.id)).toEqual(["1", "2"]);
    expect(parsed.entries[1]).toMatchObject({ text: "second, with a comma", moodLabel: "M", promptText: "P" });
  });
});
