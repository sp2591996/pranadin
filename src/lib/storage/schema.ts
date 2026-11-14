/**
 * Storage names, versions and record validators. Small hand-written checks
 * (not zod) so the client bundle stays light.
 */
import {
  JOURNAL_MAX_CHARS,
  LOCALES,
  MOODS,
  PRACTICE_KINDS,
  type JournalEntry,
  type PracticeLog,
} from "@/lib/types";
import { StorageError, type StoreSpec } from "./types";

/** Every key and database we create starts with this, so "Clear my data" can find them all. */
export const STORAGE_PREFIX = "antaryatra.";
export const DB_NAME = "antaryatra";
export const DB_VERSION = 1;
export const PREFS_KEY = `${STORAGE_PREFIX}prefs.v1`;
export const lsStoreKey = (store: string) => `${STORAGE_PREFIX}store.${store}.v1`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function fail(msg: string): never {
  throw new StorageError("invalid_record", msg);
}

function base(x: { v: unknown; id: unknown; localDate: unknown }) {
  if (x.v !== 1) fail("v must be 1");
  if (typeof x.id !== "string" || x.id.length === 0) fail("id must be a non-empty string");
  if (typeof x.localDate !== "string" || !DATE_RE.test(x.localDate)) fail("localDate must be YYYY-MM-DD");
}

export const journalSpec: StoreSpec<JournalEntry> = {
  name: "journal",
  timeField: "createdAt",
  validate(x) {
    base(x);
    if (!Number.isFinite(x.createdAt) || !Number.isFinite(x.updatedAt)) fail("createdAt/updatedAt must be numbers");
    if (typeof x.text !== "string") fail("text must be a string");
    if (x.text.length > JOURNAL_MAX_CHARS) {
      throw new StorageError("too_long", `Journal text is limited to ${JOURNAL_MAX_CHARS} characters`);
    }
    if (x.mood !== null && !(MOODS as readonly string[]).includes(x.mood)) fail("unknown mood");
    if (!(LOCALES as readonly string[]).includes(x.locale)) fail("unknown locale");
    if (x.promptId !== null && typeof x.promptId !== "string") fail("promptId must be string or null");
  },
};

export const practiceLogSpec: StoreSpec<PracticeLog> = {
  name: "practiceLog",
  timeField: "at",
  validate(x) {
    base(x);
    if (!Number.isFinite(x.at)) fail("at must be a number");
    if (!(PRACTICE_KINDS as readonly string[]).includes(x.kind)) fail("unknown practice kind");
    if (!(x.plannedSec >= 0) || !(x.actualSec >= 0)) fail("durations must be >= 0");
    if (typeof x.completed !== "boolean") fail("completed must be boolean");
    if (x.source !== "plan" && x.source !== "free") fail("source must be plan or free");
  },
};
