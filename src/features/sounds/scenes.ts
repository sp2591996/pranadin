/**
 * Sounds the player offers. A "sound" is one recording (src/lib/audio-manifest.ts)
 * or one made on the device (GENERATED). A scene layers 2 to 3 sounds, each
 * with its own volume. Names are `sounds.scene.<id>` strings.
 */
import { trackById } from "@/lib/audio-manifest";

export const GENERATED = ["om", "bells", "soham"] as const;
export type GeneratedId = (typeof GENERATED)[number];

export const isGenerated = (id: string): id is GeneratedId => (GENERATED as readonly string[]).includes(id);

export interface Layer {
  /** A GENERATED id or a manifest track id. */
  id: string;
  /** 0 to 1. */
  volume: number;
  /** For a "once" recording inside a scene: play again every this many seconds. */
  everySec?: number;
}

export interface Scene {
  id: string;
  layers: readonly Layer[];
}

export const SCENES: readonly Scene[] = [
  {
    id: "rain-hearth",
    layers: [
      { id: "rain", volume: 0.7 },
      { id: "fire", volume: 0.45 },
    ],
  },
  {
    id: "wind-om",
    layers: [
      { id: "wind", volume: 0.5 },
      { id: "om", volume: 0.4 },
      { id: "bells", volume: 0.25 },
    ],
  },
  {
    id: "temple-night",
    layers: [
      { id: "fire", volume: 0.4 },
      { id: "om", volume: 0.35 },
      { id: "bell", volume: 0.5, everySec: 45 },
    ],
  },
  {
    id: "still-breath",
    layers: [
      { id: "rain", volume: 0.4 },
      { id: "soham", volume: 0.5 },
    ],
  },
];

export const SLEEP_OPTIONS = [10, 20, 30, 60] as const;

/** Throws nothing: false when a scene names a sound that does not exist. */
export function sceneIsValid(s: Scene): boolean {
  return s.layers.length >= 1 && s.layers.length <= 3 && s.layers.every((l) => isGenerated(l.id) || !!trackById(l.id));
}
