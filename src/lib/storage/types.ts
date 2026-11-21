/**
 * Storage interface (E-02 / E-04 contract, ADR-005). Features talk to
 * `Repo<T>` only, never to IndexedDB directly, so a sync adapter can be
 * added later without rewriting screens.
 */
import type { JapaState, JournalEntry, LocalDateKey, PracticeLog, YogaProgress } from "@/lib/types";

export interface ListQuery {
  /** Sort by the store's time field. Default "desc" (newest first). */
  direction?: "asc" | "desc";
  limit?: number;
  /** Inclusive `localDate` range. */
  fromDate?: LocalDateKey;
  toDate?: LocalDateKey;
}

export interface Repo<T extends { id: string }> {
  list(q?: ListQuery): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  /** Insert or replace. Validates the record and throws `StorageError` if invalid. */
  put(record: T): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
  count(): Promise<number>;
}

/**
 * Where data is actually kept on this device.
 * - `indexeddb`: normal, durable.
 * - `localstorage`: IndexedDB unavailable; durable but ~5 MB cap.
 * - `memory`: nothing persists (e.g. storage blocked). The UI must say so.
 */
export type StorageBackend = "indexeddb" | "localstorage" | "memory";

export interface AppStorage {
  backend: StorageBackend;
  journal: Repo<JournalEntry>;
  practiceLog: Repo<PracticeLog>;
  japa: Repo<JapaState>;
  yogaProgress: Repo<YogaProgress>;
}

export type StorageErrorCode = "invalid_record" | "too_long" | "unavailable" | "quota";

export class StorageError extends Error {
  constructor(
    public readonly code: StorageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/** Describes a store: its name, time field for sorting, and a validator. */
export interface StoreSpec<T> {
  name: "journal" | "practiceLog" | "japa" | "yogaProgress";
  timeField: "createdAt" | "at";
  validate(x: T): void;
  /** Upgrade an older stored shape to the current one, on every read. Must be idempotent. */
  upgrade?(x: T): T;
}
