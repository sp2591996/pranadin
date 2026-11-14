/**
 * Build-time content loader. Import ONLY from Server Components, scripts or
 * tests (it uses `node:fs` and zod). Pages read content here during
 * `next build` and pass plain, already-localized data to Client Components,
 * so the browser gets only the active locale and no validator code.
 *
 * Missing files are allowed (Content may not have delivered yet): the app
 * falls back to placeholders. Invalid files throw, which fails the build.
 */
import fs from "node:fs";
import path from "node:path";
import type { z } from "zod";
import type { Locale } from "@/i18n/config";
import { resolveMessages, type ResolvedMessages } from "@/i18n/resolve";
import { COLLECTIONS, type CollectionPath, uiEnSchema, uiTranslationSchema } from "./schema";

export const CONTENT_DIR = path.join(process.cwd(), "content");

function readJson(rel: string): unknown | null {
  const file = path.join(CONTENT_DIR, rel);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`content/${rel}: invalid JSON (${(e as Error).message})`);
  }
}

function parseOrThrow<S extends z.ZodType>(schema: S, rel: string, data: unknown): z.infer<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const issues = r.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`content/${rel} does not match the schema:\n${issues}`);
  }
  return r.data;
}

export function loadUiEn() {
  const rel = "ui/en.json";
  const data = readJson(rel);
  return data === null ? null : parseOrThrow(uiEnSchema, rel, data);
}

export function loadUiTranslation(locale: Exclude<Locale, "en">) {
  const rel = `ui/${locale}.json`;
  const data = readJson(rel);
  return data === null ? null : parseOrThrow(uiTranslationSchema, rel, data);
}

const messagesCache = new Map<Locale, ResolvedMessages>();

/** Resolved UI strings for a locale, memoised for the build. */
export function loadMessages(locale: Locale): ResolvedMessages {
  const hit = messagesCache.get(locale);
  if (hit) return hit;
  const en = loadUiEn();
  const tr = locale === "en" ? null : loadUiTranslation(locale);
  const resolved = resolveMessages(locale, en, tr);
  messagesCache.set(locale, resolved);
  return resolved;
}

export function loadCollection<P extends CollectionPath>(rel: P): z.infer<(typeof COLLECTIONS)[P]> | null {
  const data = readJson(rel);
  return data === null ? null : (parseOrThrow(COLLECTIONS[rel], rel, data) as z.infer<(typeof COLLECTIONS)[P]>);
}
