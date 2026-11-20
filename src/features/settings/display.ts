/**
 * Text size (FR-9, US-23, US-29, QA-06): 100 / 115 / 130 %, applied as the
 * root font size so every rem-based size scales. Stored on the device under
 * `pranadin.display.textSize.v1` until `Prefs` gains a field (CR-D2-05);
 * "Clear my data" removes it with every other `pranadin.*` key.
 */
import { readLocal, writeLocal } from "@/features/shared/device";

export const TEXT_SIZES = ["standard", "large", "largest"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export const TEXT_SIZE_PERCENT: Record<TextSize, number> = { standard: 100, large: 115, largest: 130 };

const KEY = "display.textSize.v1";

export function readTextSize(): TextSize {
  const v = readLocal<string>(KEY, "standard");
  return (TEXT_SIZES as readonly string[]).includes(v) ? (v as TextSize) : "standard";
}

export function applyTextSize(size: TextSize): void {
  const el = document.documentElement;
  if (size === "standard") el.style.removeProperty("font-size");
  else el.style.fontSize = `${TEXT_SIZE_PERCENT[size]}%`;
}

export function writeTextSize(size: TextSize): void {
  writeLocal(KEY, size);
  applyTextSize(size);
}
