/**
 * UI string keys come from Content's English file (`content/en/ui.json`,
 * owned by Content). This is a type-only import: nothing from the JSON is
 * bundled here. If code uses a key Content has not defined, or Content
 * removes a key code uses, `tsc` fails.
 *
 * Need a new key? Ask Content (stand-up / CONTRACTS.md) to add it to their
 * master; do not hard-code copy in components.
 */
import type enUi from "../../content/en/ui.json";

export type MessageKey = keyof (typeof enUi)["strings"];
export type Messages = Record<MessageKey, string>;

/** Glossary keys for panchang values (Content's `tithi.*`, `nakshatra.*`, `masa.*`). */
export function tithiKey(index: number): MessageKey {
  if (index === 14) return "tithi.purnima";
  if (index === 29) return "tithi.amavasya";
  return `tithi.${(index % 15) + 1}` as MessageKey;
}
export function nakshatraKey(index: number): MessageKey {
  return `nakshatra.${index + 1}` as MessageKey;
}
export function masaKey(index: number): MessageKey {
  return `masa.${index + 1}` as MessageKey;
}
