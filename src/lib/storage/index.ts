/**
 * On-device storage entry point (E-04). Browser-only: call from Client
 * Components inside effects or event handlers, never during render on the
 * server.
 *
 *   const s = await getStorage();
 *   await s.journal.put(entry);
 *   const entries = await s.journal.list();          // newest first
 *   if (s.backend === "memory") showNotSavedWarning();
 */
import type { JournalEntry, PracticeLog } from "@/lib/types";
import { createPrefsStore, type PrefsStore } from "./prefs";
import { IdbRepo, LocalStorageRepo, MemoryRepo, openAppDb } from "./repos";
import { DB_NAME, journalSpec, practiceLogSpec, STORAGE_PREFIX } from "./schema";
import type { AppStorage } from "./types";

export * from "./types";
export { DEFAULT_PREFS, sanitizePrefs, type PrefsStore } from "./prefs";
export { STORAGE_PREFIX, DB_NAME, PREFS_KEY } from "./schema";

const OPEN_TIMEOUT_MS = 3000;

/** Returns a working localStorage, or null if it is missing or blocked. */
export function probeLocalStorage(): Storage | null {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    const k = `${STORAGE_PREFIX}probe`;
    ls.setItem(k, "1");
    ls.removeItem(k);
    return ls;
  } catch {
    return null;
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("IndexedDB open timed out")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

/**
 * Build storage with the best available backend:
 * IndexedDB → localStorage → memory. Never throws.
 */
export async function createStorage(): Promise<AppStorage> {
  if (typeof globalThis.indexedDB !== "undefined") {
    try {
      const db = await withTimeout(openAppDb(), OPEN_TIMEOUT_MS);
      const dbp = Promise.resolve(db);
      return {
        backend: "indexeddb",
        journal: new IdbRepo<JournalEntry>(dbp, journalSpec),
        practiceLog: new IdbRepo<PracticeLog>(dbp, practiceLogSpec),
      };
    } catch {
      // Fall through (private mode, blocked, corrupt profile).
    }
  }
  const ls = probeLocalStorage();
  if (ls) {
    return {
      backend: "localstorage",
      journal: new LocalStorageRepo<JournalEntry>(journalSpec, ls),
      practiceLog: new LocalStorageRepo<PracticeLog>(practiceLogSpec, ls),
    };
  }
  return {
    backend: "memory",
    journal: new MemoryRepo<JournalEntry>(journalSpec),
    practiceLog: new MemoryRepo<PracticeLog>(practiceLogSpec),
  };
}

let storagePromise: Promise<AppStorage> | null = null;

/** App-wide storage singleton. */
export function getStorage(): Promise<AppStorage> {
  storagePromise ??= createStorage();
  return storagePromise;
}

let prefsStore: PrefsStore | null = null;
/** App-wide preferences (synchronous). */
export function getPrefs(): PrefsStore {
  prefsStore ??= createPrefsStore(probeLocalStorage());
  return prefsStore;
}

/** Test hook: forget singletons. */
export function __resetStorageForTests(): void {
  storagePromise = null;
  prefsStore = null;
}

/**
 * Ask the browser not to evict our data under storage pressure (ADR-005).
 * Call after the first journal save. Returns whether persistence is granted.
 */
export async function requestPersistence(): Promise<boolean> {
  try {
    return (await globalThis.navigator?.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

/**
 * "Clear my data" (FR-13, ADR-011): wipe IndexedDB, every `pranadin.*`
 * localStorage/sessionStorage key, Cache Storage and service workers.
 * Callers then navigate to onboarding.
 */
export async function clearAllData(): Promise<void> {
  if (storagePromise) {
    try {
      const s = await storagePromise;
      await Promise.all([s.journal.clear(), s.practiceLog.clear()]);
    } catch {
      /* continue with the hard wipe */
    }
  }
  storagePromise = null;
  prefsStore = null;

  await new Promise<void>((resolve) => {
    try {
      if (typeof globalThis.indexedDB === "undefined") return resolve();
      const req = globalThis.indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });

  for (const area of ["localStorage", "sessionStorage"] as const) {
    try {
      const st = globalThis[area];
      if (!st) continue;
      const keys: string[] = [];
      for (let i = 0; i < st.length; i++) {
        const k = st.key(i);
        if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => st.removeItem(k));
    } catch {
      /* blocked storage has nothing to clear */
    }
  }

  try {
    if (globalThis.caches) {
      const names = await globalThis.caches.keys();
      await Promise.all(names.map((n) => globalThis.caches.delete(n)));
    }
  } catch {
    /* ignore */
  }
  try {
    const regs = (await globalThis.navigator?.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    /* ignore */
  }
}

/** Journal export (FR-13). Plain text or JSON; never leaves the device unless the user saves/shares the file. */
export function serializeJournal(entries: readonly JournalEntry[], format: "json" | "txt"): string {
  const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
  if (format === "json") {
    return JSON.stringify({ app: "pranadin", exportVersion: 1, entries: sorted }, null, 2);
  }
  return sorted
    .map((e) => [`# ${e.localDate}`, e.mood ? `Mood: ${e.mood}` : null, "", e.text].filter((x) => x !== null).join("\n"))
    .join("\n\n");
}

/** Random id for new records. */
export function newId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  if (c?.getRandomValues) {
    const bytes = c.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
