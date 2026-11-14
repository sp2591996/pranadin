/**
 * English (simplified transliteration) fallback names. Reviewed HI/MR/EN
 * names come from Content's glossary (`app/content/glossary/panchang.json`,
 * ML-8), keyed by the same indices.
 */
const TITHI_15 = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami",
  "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi",
] as const;

/** 30 names, index 0..29 (14 = Purnima, 29 = Amavasya). */
export const TITHI_NAMES_EN: readonly string[] = [...TITHI_15, "Purnima", ...TITHI_15, "Amavasya"];

export const NAKSHATRA_NAMES_EN: readonly string[] = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu",
  "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta",
  "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha",
  "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha", "Purva Bhadrapada",
  "Uttara Bhadrapada", "Revati",
];

export const MASA_NAMES_EN: readonly string[] = [
  "Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada",
  "Ashwin", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna",
];

export function tithiNameEn(index: number): string {
  return TITHI_NAMES_EN[index] ?? "";
}
