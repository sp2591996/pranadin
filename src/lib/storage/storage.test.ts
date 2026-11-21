import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { JournalEntry, PracticeLog } from "@/lib/types";
import {
  __resetStorageForTests,
  clearAllData,
  createStorage,
  DB_NAME,
  DEFAULT_PREFS,
  getPrefs,
  getStorage,
  newId,
  PREFS_KEY,
  sanitizePrefs,
  serializeJournal,
  StorageError,
} from "./index";
import { createPrefsStore } from "./prefs";
import { IdbRepo, LocalStorageRepo, MemoryRepo, MIGRATIONS, openAppDb } from "./repos";
import { DB_VERSION, journalSpec, lsStoreKey, practiceLogSpec } from "./schema";
import type { Repo } from "./types";

class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}

const g = globalThis as unknown as { indexedDB: IDBFactory | undefined; localStorage: Storage | undefined };

function entry(over: Partial<JournalEntry> = {}): JournalEntry {
  return {
    v: 1,
    id: newId(),
    createdAt: 1_763_000_000_000,
    updatedAt: 1_763_000_000_000,
    localDate: "2026-11-15",
    mood: "okay",
    text: "A quiet morning.",
    promptId: null,
    locale: "en",
    ...over,
  };
}

function log(over: Partial<PracticeLog> = {}): PracticeLog {
  return {
    v: 1,
    id: newId(),
    at: 1_763_000_000_000,
    localDate: "2026-11-15",
    kind: "breath",
    refId: "sama-vritti",
    plannedSec: 180,
    actualSec: 180,
    completed: true,
    source: "plan",
    ...over,
  };
}

beforeEach(() => {
  g.indexedDB = new IDBFactory();
  g.localStorage = new MemStorage();
  __resetStorageForTests();
});
afterEach(() => {
  __resetStorageForTests();
});

const backends: [string, () => Repo<JournalEntry>][] = [
  ["indexeddb", () => new IdbRepo<JournalEntry>(openAppDb(), journalSpec)],
  ["localstorage", () => new LocalStorageRepo<JournalEntry>(journalSpec, g.localStorage!)],
  ["memory", () => new MemoryRepo<JournalEntry>(journalSpec)],
];

describe.each(backends)("Repo<JournalEntry> on %s", (_name, make) => {
  it("puts, gets, counts and deletes", async () => {
    const repo = make();
    const e = entry();
    await repo.put(e);
    expect(await repo.get(e.id)).toEqual(e);
    expect(await repo.count()).toBe(1);
    await repo.delete(e.id);
    expect(await repo.get(e.id)).toBeUndefined();
    expect(await repo.count()).toBe(0);
  });

  it("replaces on put with the same id", async () => {
    const repo = make();
    const e = entry();
    await repo.put(e);
    await repo.put({ ...e, text: "edited", updatedAt: e.updatedAt + 1 });
    expect((await repo.get(e.id))?.text).toBe("edited");
    expect(await repo.count()).toBe(1);
  });

  it("lists newest first by default, oldest first on request, with limit", async () => {
    const repo = make();
    const a = entry({ id: "a", createdAt: 1 });
    const b = entry({ id: "b", createdAt: 3 });
    const c = entry({ id: "c", createdAt: 2 });
    await repo.put(a);
    await repo.put(b);
    await repo.put(c);
    expect((await repo.list()).map((x) => x.id)).toEqual(["b", "c", "a"]);
    expect((await repo.list({ direction: "asc" })).map((x) => x.id)).toEqual(["a", "c", "b"]);
    expect((await repo.list({ limit: 2 })).map((x) => x.id)).toEqual(["b", "c"]);
  });

  it("filters by inclusive localDate range", async () => {
    const repo = make();
    await repo.put(entry({ id: "d1", localDate: "2026-11-14", createdAt: 1 }));
    await repo.put(entry({ id: "d2", localDate: "2026-11-15", createdAt: 2 }));
    await repo.put(entry({ id: "d3", localDate: "2026-11-16", createdAt: 3 }));
    const r = await repo.list({ fromDate: "2026-11-15", toDate: "2026-11-16", direction: "asc" });
    expect(r.map((x) => x.id)).toEqual(["d2", "d3"]);
  });

  it("returns copies, so callers cannot mutate stored data", async () => {
    const repo = make();
    const e = entry();
    await repo.put(e);
    const got = (await repo.get(e.id))!;
    got.text = "mutated";
    expect((await repo.get(e.id))?.text).toBe("A quiet morning.");
  });

  it("rejects invalid records and over-long text", async () => {
    const repo = make();
    await expect(repo.put(entry({ localDate: "15/11/2026" }))).rejects.toBeInstanceOf(StorageError);
    await expect(repo.put(entry({ mood: "angry" as never }))).rejects.toMatchObject({ code: "invalid_record" });
    await expect(repo.put(entry({ text: "x".repeat(1001) }))).rejects.toMatchObject({ code: "too_long" });
    expect(await repo.count()).toBe(0);
  });

  it("clears the store", async () => {
    const repo = make();
    await repo.put(entry());
    await repo.put(entry());
    await repo.clear();
    expect(await repo.count()).toBe(0);
  });
});

describe("practiceLog store", () => {
  it("validates and orders by `at`", async () => {
    const repo = new IdbRepo<PracticeLog>(openAppDb(), practiceLogSpec);
    await repo.put(log({ id: "x", at: 10 }));
    await repo.put(log({ id: "y", at: 20 }));
    expect((await repo.list()).map((r) => r.id)).toEqual(["y", "x"]);
    await expect(repo.put(log({ kind: "yoga" as never }))).rejects.toMatchObject({ code: "invalid_record" });
    await expect(repo.put(log({ source: "other" as never }))).rejects.toBeInstanceOf(StorageError);
  });
});

describe("migrations", () => {
  it("has one step per DB version", () => {
    expect(MIGRATIONS).toHaveLength(DB_VERSION);
  });

  it("v1 creates the journal and practiceLog stores with their indexes", async () => {
    const db = await openAppDb();
    expect([...db.objectStoreNames].sort()).toEqual(["japa", "journal", "practiceLog", "trips", "yogaProgress"]);
    const tx = db.transaction(["journal", "practiceLog"]);
    expect([...tx.objectStore("journal").indexNames].sort()).toEqual(["createdAt", "localDate"]);
    expect([...tx.objectStore("practiceLog").indexNames].sort()).toEqual(["at", "localDate"]);
    db.close();
  });

  it("keeps data across re-open (no destructive upgrade)", async () => {
    const r1 = new IdbRepo<JournalEntry>(openAppDb(), journalSpec);
    const e = entry();
    await r1.put(e);
    const r2 = new IdbRepo<JournalEntry>(openAppDb(), journalSpec);
    expect(await r2.get(e.id)).toEqual(e);
  });

  it("upgrades moods stored with the old ids to Content's ids on read (IndexedDB)", async () => {
    const db = await openAppDb();
    const old = { ...entry(), mood: "bright" } as unknown as JournalEntry;
    await db.put("journal", old as never); // written by an older build, bypassing validation
    db.close();
    const repo = new IdbRepo<JournalEntry>(openAppDb(), journalSpec);
    expect((await repo.get(old.id))?.mood).toBe("peaceful");
    expect((await repo.list()).map((r) => r.mood)).toEqual(["peaceful"]);
    const got = (await repo.get(old.id))!;
    await repo.put({ ...got, text: "edited" }); // re-saving passes the new validator
  });

  it("upgrades every old mood id from localStorage and leaves new ids alone", async () => {
    const ls = g.localStorage!;
    const olds = { bright: "peaceful", light: "grateful", steady: "okay", low: "restless", heavy: "heavy" } as const;
    const rows = Object.keys(olds).map((m, i) => ({ ...entry({ createdAt: i }), mood: m }));
    ls.setItem("pranadin.store.journal.v1", JSON.stringify([...rows, entry({ mood: "grateful" })]));
    const repo = new LocalStorageRepo<JournalEntry>(journalSpec, ls);
    const byId = new Map((await repo.list()).map((r) => [r.id, r.mood]));
    for (const r of rows) expect(byId.get(r.id)).toBe(olds[r.mood as keyof typeof olds]);
    expect([...byId.values()].filter((m) => m === "grateful")).toHaveLength(2);
  });
});

describe("backend selection", () => {
  it("uses IndexedDB when available", async () => {
    expect((await createStorage()).backend).toBe("indexeddb");
  });

  it("falls back to localStorage when IndexedDB is missing, and data survives a new instance", async () => {
    g.indexedDB = undefined;
    const s1 = await createStorage();
    expect(s1.backend).toBe("localstorage");
    const e = entry();
    await s1.journal.put(e);
    expect(g.localStorage!.getItem(lsStoreKey("journal"))).toContain(e.id);
    const s2 = await createStorage();
    expect(await s2.journal.get(e.id)).toEqual(e);
  });

  it("falls back to localStorage when IndexedDB.open throws", async () => {
    g.indexedDB = {
      open() {
        throw new DOMException("blocked", "SecurityError");
      },
    } as unknown as IDBFactory;
    expect((await createStorage()).backend).toBe("localstorage");
  });

  it("falls back to memory when nothing is available", async () => {
    g.indexedDB = undefined;
    g.localStorage = {
      setItem() {
        throw new DOMException("denied", "SecurityError");
      },
    } as unknown as Storage;
    const s = await createStorage();
    expect(s.backend).toBe("memory");
    await s.journal.put(entry());
    expect(await s.journal.count()).toBe(1);
  });

  it("ignores a corrupt localStorage value instead of crashing", async () => {
    g.indexedDB = undefined;
    g.localStorage!.setItem(lsStoreKey("journal"), "{not json");
    const s = await createStorage();
    expect(await s.journal.list()).toEqual([]);
  });

  it("getStorage returns one shared instance", async () => {
    expect(await getStorage()).toBe(await getStorage());
  });
});

describe("prefs", () => {
  it("returns defaults when nothing is stored", () => {
    expect(getPrefs().read()).toEqual(DEFAULT_PREFS);
  });

  it("writes, reads back and survives a new store instance", () => {
    getPrefs().write({ locale: "mr", cityId: "pune", onboarded: true });
    const again = createPrefsStore(g.localStorage!);
    expect(again.read()).toMatchObject({ locale: "mr", cityId: "pune", onboarded: true, goal: "calm" });
  });

  it("sanitizes garbage and unknown values to defaults", () => {
    expect(sanitizePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(sanitizePrefs({ locale: "fr", minutes: 7, reminderTime: "25:00", theme: "pink" })).toEqual(DEFAULT_PREFS);
    g.localStorage!.setItem(PREFS_KEY, "{bad");
    expect(getPrefs().read()).toEqual(DEFAULT_PREFS);
  });

  it("works in memory when localStorage is blocked", () => {
    const p = createPrefsStore(null);
    expect(p.persistent).toBe(false);
    p.write({ goal: "sleep" });
    expect(p.read().goal).toBe("sleep");
  });
});

describe("clearAllData", () => {
  it("wipes IndexedDB and every pranadin.* key, and leaves other keys alone", async () => {
    const s = await getStorage();
    await s.journal.put(entry());
    await s.practiceLog.put(log());
    getPrefs().write({ onboarded: true });
    g.localStorage!.setItem("other.site.key", "keep");

    await clearAllData();

    expect(g.localStorage!.getItem(PREFS_KEY)).toBeNull();
    expect(g.localStorage!.getItem("other.site.key")).toBe("keep");
    for (let i = 0; i < g.localStorage!.length; i++) {
      expect(g.localStorage!.key(i)?.startsWith("pranadin.")).toBe(false);
    }
    const dbs = await g.indexedDB!.databases();
    expect(dbs.map((d) => d.name)).not.toContain(DB_NAME);

    const fresh = await getStorage();
    expect(await fresh.journal.count()).toBe(0);
    expect(getPrefs().read().onboarded).toBe(false);
  });
});

describe("serializeJournal", () => {
  const entries = [
    entry({ id: "2", createdAt: 2, localDate: "2026-11-16", text: "Second", mood: null }),
    entry({ id: "1", createdAt: 1, localDate: "2026-11-15", text: "First" }),
  ];
  it("exports JSON oldest first with a version header", () => {
    const parsed = JSON.parse(serializeJournal(entries, "json"));
    expect(parsed.app).toBe("pranadin");
    expect(parsed.exportVersion).toBe(1);
    expect(parsed.entries.map((e: JournalEntry) => e.id)).toEqual(["1", "2"]);
  });
  it("exports readable text", () => {
    expect(serializeJournal(entries, "txt")).toBe("# 2026-11-15\nMood: okay\n\nFirst\n\n# 2026-11-16\n\nSecond");
  });
});

describe("newId", () => {
  it("is unique", () => {
    const ids = new Set(Array.from({ length: 200 }, newId));
    expect(ids.size).toBe(200);
  });
});
