/**
 * Repo implementations: IndexedDB (normal), localStorage and memory (fallbacks).
 * All three behave identically; the shared test suite runs against each.
 */
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { JournalEntry, PracticeLog } from "@/lib/types";
import { DB_NAME, DB_VERSION, lsStoreKey } from "./schema";
import { StorageError, type ListQuery, type Repo, type StoreSpec } from "./types";

type Rec = { id: string; localDate: string };

export interface PranaDinDB extends DBSchema {
  journal: { key: string; value: JournalEntry; indexes: { createdAt: number; localDate: string } };
  practiceLog: { key: string; value: PracticeLog; indexes: { at: number; localDate: string } };
}

/**
 * Ordered schema migrations. Index i upgrades from version i to i+1.
 * Never edit a shipped step; append a new one and bump DB_VERSION.
 */
export const MIGRATIONS: ((db: IDBPDatabase<PranaDinDB>) => void)[] = [
  // v0 -> v1: initial stores
  (db) => {
    const j = db.createObjectStore("journal", { keyPath: "id" });
    j.createIndex("createdAt", "createdAt");
    j.createIndex("localDate", "localDate");
    const p = db.createObjectStore("practiceLog", { keyPath: "id" });
    p.createIndex("at", "at");
    p.createIndex("localDate", "localDate");
  },
];

export function openAppDb(): Promise<IDBPDatabase<PranaDinDB>> {
  if (MIGRATIONS.length !== DB_VERSION) {
    throw new Error(`DB_VERSION (${DB_VERSION}) must equal the number of migrations (${MIGRATIONS.length})`);
  }
  return openDB<PranaDinDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      for (let v = oldVersion; v < DB_VERSION; v++) MIGRATIONS[v]!(db);
    },
  }).then((db) => {
    // Another tab wants a newer version (or "Clear my data" is deleting the DB): let it.
    db.onversionchange = () => db.close();
    return db;
  });
}

/** Shared filtering and ordering, so every backend returns the same order. */
export function applyQuery<T extends Rec>(rows: T[], timeField: string, q: ListQuery = {}): T[] {
  let out = rows.filter(
    (r) => (q.fromDate === undefined || r.localDate >= q.fromDate) && (q.toDate === undefined || r.localDate <= q.toDate),
  );
  const dir = q.direction === "asc" ? 1 : -1;
  out = out.sort((a, b) => {
    const ta = (a as unknown as Record<string, number>)[timeField]!;
    const tb = (b as unknown as Record<string, number>)[timeField]!;
    const d = (ta - tb) * dir;
    return d !== 0 ? d : a.id < b.id ? -dir : a.id > b.id ? dir : 0;
  });
  return q.limit !== undefined ? out.slice(0, Math.max(0, q.limit)) : out;
}

function upgrade<T>(spec: StoreSpec<T>, x: T): T {
  return spec.upgrade ? spec.upgrade(x) : x;
}

function clone<T>(x: T): T {
  return structuredClone(x);
}

export class IdbRepo<T extends Rec> implements Repo<T> {
  constructor(
    private readonly dbp: Promise<IDBPDatabase<PranaDinDB>>,
    private readonly spec: StoreSpec<T>,
  ) {}

  async list(q?: ListQuery): Promise<T[]> {
    const db = await this.dbp;
    // Fine for launch volumes (≤ a few thousand rows). Switch to an index
    // cursor if journals grow large.
    const rows = (await db.getAll(this.spec.name)) as unknown as T[];
    return applyQuery(rows.map((r) => upgrade(this.spec, r)), this.spec.timeField, q);
  }
  async get(id: string): Promise<T | undefined> {
    const db = await this.dbp;
    const r = (await db.get(this.spec.name, id)) as unknown as T | undefined;
    return r ? upgrade(this.spec, r) : undefined;
  }
  async put(record: T): Promise<void> {
    this.spec.validate(record);
    try {
      const db = await this.dbp;
      await db.put(this.spec.name, clone(record) as never);
    } catch (e) {
      if ((e as DOMException)?.name === "QuotaExceededError") throw new StorageError("quota", "Device storage is full");
      throw e;
    }
  }
  async delete(id: string): Promise<void> {
    const db = await this.dbp;
    await db.delete(this.spec.name, id);
  }
  async clear(): Promise<void> {
    const db = await this.dbp;
    await db.clear(this.spec.name);
  }
  async count(): Promise<number> {
    const db = await this.dbp;
    return db.count(this.spec.name);
  }
}

export class MemoryRepo<T extends Rec> implements Repo<T> {
  protected rows = new Map<string, T>();
  constructor(protected readonly spec: StoreSpec<T>) {}

  async list(q?: ListQuery): Promise<T[]> {
    return applyQuery([...this.rows.values()].map(clone), this.spec.timeField, q);
  }
  async get(id: string): Promise<T | undefined> {
    const r = this.rows.get(id);
    return r ? clone(r) : undefined;
  }
  async put(record: T): Promise<void> {
    this.spec.validate(record);
    this.rows.set(record.id, clone(record));
    this.persist();
  }
  async delete(id: string): Promise<void> {
    this.rows.delete(id);
    this.persist();
  }
  async clear(): Promise<void> {
    this.rows.clear();
    this.persist();
  }
  async count(): Promise<number> {
    return this.rows.size;
  }
  protected persist(): void {}
}

/** Fallback when IndexedDB is unavailable. Whole store kept as one JSON value. */
export class LocalStorageRepo<T extends Rec> extends MemoryRepo<T> {
  private readonly key: string;
  constructor(
    spec: StoreSpec<T>,
    private readonly ls: Storage,
  ) {
    super(spec);
    this.key = lsStoreKey(spec.name);
    try {
      const raw = ls.getItem(this.key);
      const arr = raw ? (JSON.parse(raw) as T[]) : [];
      for (const r of Array.isArray(arr) ? arr : []) if (r && typeof r.id === "string") this.rows.set(r.id, upgrade(spec, r));
    } catch {
      // Corrupt value: start empty rather than crash. The old value is overwritten on next write.
    }
  }
  protected override persist(): void {
    try {
      this.ls.setItem(this.key, JSON.stringify([...this.rows.values()]));
    } catch {
      throw new StorageError("quota", "Device storage is full");
    }
  }
}
