/**
 * Recordings the app ships in `public/audio/` (D-026). To add a sound: put
 * the file under public/audio/<category>/, add ONE line to TRACKS below, and
 * add a row to public/audio/CREDITS.md (a unit test checks both).
 *
 * `name` is the English fallback. For other languages add a
 * `sounds.track.<id>` string to content/<lang>/ui.json; without it the
 * English name is shown.
 */
export type AudioCategory = "nature" | "temple" | "mantras";

export interface AudioTrack {
  /** Stable id, also used in scenes and in `sounds.track.<id>`. */
  id: string;
  /** Path under public/audio/. */
  file: string;
  category: AudioCategory;
  /** English name (fallback when no translated string exists). */
  name: string;
  /** "loop" plays until stopped, with no gap at the seam. "once" plays to its end. */
  mode: "loop" | "once";
}

export const AUDIO_BASE = "/audio/";
export const AUDIO_CATEGORIES: readonly AudioCategory[] = ["nature", "temple", "mantras"];

export const TRACKS: readonly AudioTrack[] = [
  { id: "rain", file: "nature/rain.mp3", category: "nature", name: "Rain", mode: "loop" },
  { id: "fire", file: "nature/fire.mp3", category: "nature", name: "Fire", mode: "loop" },
  { id: "wind", file: "nature/wind.mp3", category: "nature", name: "Wind", mode: "loop" },
  { id: "conch", file: "temple/conch.mp3", category: "temple", name: "Conch", mode: "once" },
  { id: "bell", file: "temple/bell.mp3", category: "temple", name: "Bell", mode: "once" },
];

export function trackById(id: string): AudioTrack | undefined {
  return TRACKS.find((t) => t.id === id);
}

export function tracksIn(category: AudioCategory): AudioTrack[] {
  return TRACKS.filter((t) => t.category === category);
}

/** Categories that have at least one file, in display order. */
export function usedCategories(): AudioCategory[] {
  return AUDIO_CATEGORIES.filter((c) => tracksIn(c).length > 0);
}

export function trackUrl(t: AudioTrack): string {
  return `${AUDIO_BASE}${t.file}`;
}
