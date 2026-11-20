/**
 * Sound engine (D-026): Web Audio only, one playing item at a time (a single
 * sound is a scene of one layer). Nothing is created until play() is called
 * from a tap, so nothing autoplays.
 *
 * - Recordings are fetched from /audio/ (connect-src 'self'), decoded once,
 *   and looped with an equal-power crossfade so there is no gap or click.
 * - Om drone, soft bells and so'ham are synthesised live (ideas ported from
 *   the prototype's sound-engine.ts).
 * - Sleep timer fades everything out over FADE_S, then stops.
 */
import { trackById, trackUrl, type AudioTrack } from "@/lib/audio-manifest";
import { isGenerated, type GeneratedId, type Layer } from "./scenes";

export type Status = "idle" | "loading" | "playing" | "error";

export interface Snapshot {
  /** "scene:<id>" or "sound:<id>", or null when idle. */
  key: string | null;
  status: Status;
  layers: readonly { id: string; volume: number }[];
  /** ms since epoch when the sleep timer ends, or null. */
  sleepEndsAt: number | null;
  sleepMinutes: number | null;
}

const IDLE: Snapshot = { key: null, status: "idle", layers: [], sleepEndsAt: null, sleepMinutes: null };
export const FADE_S = 10;
const STOP_FADE_S = 0.6;
const MAX_XFADE_S = 3;

interface RunningLayer {
  gain: GainNode;
  stop: () => void;
}

const bufferCache = new Map<string, Promise<AudioBuffer>>();

function curve(up: boolean): Float32Array {
  const n = 48;
  const a = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    a[i] = up ? Math.sin((x * Math.PI) / 2) : Math.cos((x * Math.PI) / 2);
  }
  return a;
}
const UP = curve(true);
const DOWN = curve(false);

class SoundEngine {
  private ctx: AudioContext | null = null;
  private duck: GainNode | null = null;
  private running = new Map<string, RunningLayer>();
  private gen = 0;
  private snap: Snapshot = IDLE;
  private listeners = new Set<() => void>();
  private sleepTimer: ReturnType<typeof setTimeout> | null = null;
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getSnapshot = (): Snapshot => this.snap;
  getServerSnapshot = (): Snapshot => IDLE;

  private set(next: Partial<Snapshot>): void {
    this.snap = { ...this.snap, ...next };
    this.listeners.forEach((f) => f());
  }

  private getCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AC = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.duck = this.ctx.createGain();
    this.duck.connect(this.ctx.destination);
    return this.ctx;
  }

  /** Start a scene (or single sound). Stops whatever was playing. Must be called from a tap. */
  async play(key: string, layers: readonly Layer[]): Promise<void> {
    this.teardown(true);
    const my = ++this.gen;
    const ctx = this.getCtx();
    if (!ctx || !this.duck) {
      this.set({ key, status: "error", layers: layers.map((l) => ({ id: l.id, volume: l.volume })) });
      return;
    }
    this.duck.gain.cancelScheduledValues(ctx.currentTime);
    this.duck.gain.setValueAtTime(1, ctx.currentTime);
    this.set({ key, status: "loading", layers: layers.map((l) => ({ id: l.id, volume: l.volume })) });
    try {
      if (ctx.state !== "running") await ctx.resume();
      const ready = await Promise.all(layers.map((l) => this.prepare(ctx, l)));
      if (my !== this.gen) return; // superseded or stopped while loading
      ready.forEach((start, i) => {
        const l = layers[i]!;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(l.volume, ctx.currentTime + 0.8);
        gain.connect(this.duck!);
        const stop = start(gain);
        this.running.set(l.id, { gain, stop });
      });
      this.set({ status: "playing" });
    } catch {
      if (my === this.gen) {
        this.teardown(false);
        this.set({ key, status: "error" });
      }
    }
  }

  /** Per-layer volume while playing. */
  setLayerVolume(id: string, v: number): void {
    const vol = Math.min(1, Math.max(0, v));
    const r = this.running.get(id);
    if (r && this.ctx) r.gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    this.set({ layers: this.snap.layers.map((l) => (l.id === id ? { ...l, volume: vol } : l)) });
  }

  stop(): void {
    this.gen++;
    this.teardown(false);
    this.set({ ...IDLE });
  }

  /** minutes = null clears the timer. */
  setSleep(minutes: number | null): void {
    this.clearSleep();
    if (minutes === null) {
      this.set({ sleepEndsAt: null, sleepMinutes: null });
      return;
    }
    const ms = minutes * 60_000;
    this.set({ sleepEndsAt: Date.now() + ms, sleepMinutes: minutes });
    this.fadeTimer = setTimeout(() => this.fadeOut(), Math.max(0, ms - FADE_S * 1000));
    this.sleepTimer = setTimeout(() => this.stop(), ms);
  }

  private clearSleep(): void {
    if (this.sleepTimer) clearTimeout(this.sleepTimer);
    if (this.fadeTimer) clearTimeout(this.fadeTimer);
    this.sleepTimer = this.fadeTimer = null;
    if (this.ctx && this.duck) {
      this.duck.gain.cancelScheduledValues(this.ctx.currentTime);
      this.duck.gain.setTargetAtTime(1, this.ctx.currentTime, 0.1);
    }
  }

  private fadeOut(): void {
    if (!this.ctx || !this.duck) return;
    const t = this.ctx.currentTime;
    this.duck.gain.cancelScheduledValues(t);
    this.duck.gain.setValueAtTime(this.duck.gain.value, t);
    this.duck.gain.linearRampToValueAtTime(0, t + FADE_S);
  }

  /** Fade and release every running layer. */
  private teardown(quick: boolean): void {
    const ctx = this.ctx;
    if (!quick && (this.sleepTimer || this.fadeTimer)) {
      if (this.sleepTimer) clearTimeout(this.sleepTimer);
      if (this.fadeTimer) clearTimeout(this.fadeTimer);
      this.sleepTimer = this.fadeTimer = null;
    }
    const layers = [...this.running.values()];
    this.running.clear();
    for (const r of layers) {
      if (ctx) {
        const t = ctx.currentTime;
        r.gain.gain.cancelScheduledValues(t);
        r.gain.gain.setValueAtTime(r.gain.gain.value, t);
        r.gain.gain.linearRampToValueAtTime(0, t + (quick ? 0.15 : STOP_FADE_S));
      }
      setTimeout(() => {
        try {
          r.stop();
          r.gain.disconnect();
        } catch {
          /* already gone */
        }
      }, (quick ? 0.2 : STOP_FADE_S + 0.1) * 1000);
    }
    if (!quick && this.snap.sleepEndsAt !== null) this.set({ sleepEndsAt: null, sleepMinutes: null });
  }

  /** Load whatever a layer needs; returns a function that starts it on a gain node and returns its stop(). */
  private async prepare(ctx: AudioContext, l: Layer): Promise<(out: GainNode) => () => void> {
    if (isGenerated(l.id)) return (out) => startGenerated(ctx, l.id as GeneratedId, out);
    const track = trackById(l.id);
    if (!track) throw new Error(`unknown sound ${l.id}`);
    const buf = await loadBuffer(ctx, track);
    if (track.mode === "loop") return (out) => startLoop(ctx, buf, out);
    return (out) => startOnce(ctx, buf, out, l.everySec);
  }
}

function loadBuffer(ctx: AudioContext, track: AudioTrack): Promise<AudioBuffer> {
  const url = trackUrl(track);
  let p = bufferCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.arrayBuffer();
      })
      .then((b) => ctx.decodeAudioData(b));
    p.catch(() => bufferCache.delete(url));
    bufferCache.set(url, p);
  }
  return p;
}

/** Gapless loop: each pass fades in and out over X seconds and the next pass starts as the last fades. */
function startLoop(ctx: AudioContext, buf: AudioBuffer, out: GainNode): () => void {
  const D = buf.duration;
  const X = Math.min(MAX_XFADE_S, D / 4);
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const sources: AudioBufferSourceNode[] = [];

  const spawn = (at: number, first: boolean) => {
    if (stopped) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const env = ctx.createGain();
    src.connect(env).connect(out);
    if (first) env.gain.setValueAtTime(1, at);
    else env.gain.setValueCurveAtTime(UP, at, X);
    env.gain.setValueAtTime(1, at + X);
    env.gain.setValueCurveAtTime(DOWN, at + D - X, X);
    src.start(at);
    src.stop(at + D + 0.05);
    sources.push(src);
    src.onended = () => {
      const i = sources.indexOf(src);
      if (i >= 0) sources.splice(i, 1);
    };
    const nextAt = at + D - X;
    const wait = Math.max(0, (nextAt - ctx.currentTime - 1) * 1000);
    timer = setTimeout(() => spawn(nextAt, false), wait);
  };
  spawn(ctx.currentTime + 0.02, true);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* not started */
      }
    });
  };
}

function startOnce(ctx: AudioContext, buf: AudioBuffer, out: GainNode, everySec?: number): () => void {
  const play = () => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(out);
    src.start();
    active.add(src);
    src.onended = () => active.delete(src);
  };
  const active = new Set<AudioBufferSourceNode>();
  play();
  const iv = everySec ? setInterval(play, everySec * 1000) : null;
  return () => {
    if (iv) clearInterval(iv);
    active.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* ended */
      }
    });
  };
}

// ---------- generated sounds ----------

function startGenerated(ctx: AudioContext, id: GeneratedId, out: GainNode): () => void {
  if (id === "om") return omDrone(ctx, out);
  if (id === "bells") return softBells(ctx, out);
  return soham(ctx, out);
}

type Stoppable = { stop(when?: number): void };

/** Om: a low drone (about 136 Hz, the traditional Om pitch) with a few soft partials, slow vibrato and a slow swell. */
function omDrone(ctx: AudioContext, out: GainNode): () => void {
  const nodes: Stoppable[] = [];
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;
  const swell = ctx.createGain();
  swell.gain.value = 0.7;
  lp.connect(swell).connect(out);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.1;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 0.25;
  lfo.connect(lfoDepth).connect(swell.gain);
  lfo.start();
  nodes.push(lfo);
  const base = 136.1;
  const partials: [number, number, OscillatorType][] = [
    [1, 0.5, "sine"],
    [2, 0.28, "sine"],
    [3, 0.14, "triangle"],
    [4, 0.07, "sine"],
    [0.5, 0.2, "sine"],
  ];
  partials.forEach(([m, a, type], i) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = base * m;
    o.detune.value = (i % 2 ? 1 : -1) * 3;
    const g = ctx.createGain();
    g.gain.value = a * 0.5;
    const vib = ctx.createOscillator();
    vib.frequency.value = 4.5 + i * 0.3;
    const vd = ctx.createGain();
    vd.gain.value = 1.2;
    vib.connect(vd).connect(o.detune);
    vib.start();
    o.connect(g).connect(lp);
    o.start();
    nodes.push(o, vib);
  });
  return () => nodes.forEach((n) => n.stop());
}

const PENTA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

/** Soft bells: one bell every 5 to 7 s, walking up and down a pentatonic scale. */
function softBells(ctx: AudioContext, out: GainNode): () => void {
  let step = 0;
  let dir = 1;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const strike = () => {
    const f = PENTA[step]! / 2;
    step += dir;
    if (step >= PENTA.length - 1 || step <= 0) dir = -dir;
    const t0 = ctx.currentTime + 0.02;
    for (const [m, peak, dur] of [
      [1, 0.2, 5],
      [2.76, 0.06, 3],
      [5.4, 0.02, 1.6],
    ] as const) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      const o = ctx.createOscillator();
      o.frequency.value = f * m;
      o.connect(g).connect(out);
      o.start(t0);
      o.stop(t0 + dur + 0.05);
    }
    timer = setTimeout(strike, 5000 + Math.random() * 2000);
  };
  strike();
  return () => {
    if (timer) clearTimeout(timer);
  };
}

/** So'ham: a 9 s breath. "So" swells while breathing in, "ham" falls while breathing out, over a faint breath of noise. */
function soham(ctx: AudioContext, out: GainNode): () => void {
  const CYCLE = 9;
  const so = ctx.createOscillator();
  const ham = ctx.createOscillator();
  so.frequency.value = 196;
  ham.frequency.value = 147;
  const soG = ctx.createGain();
  const hamG = ctx.createGain();
  soG.gain.value = 0;
  hamG.gain.value = 0;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 700;
  so.connect(soG).connect(lp);
  ham.connect(hamG).connect(lp);
  lp.connect(out);
  // breath noise
  const len = ctx.sampleRate * 2;
  const nb = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = nb.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04;
    d[i] = last * 3;
  }
  const ns = ctx.createBufferSource();
  ns.buffer = nb;
  ns.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 500;
  const nG = ctx.createGain();
  nG.gain.value = 0;
  ns.connect(bp).connect(nG).connect(out);
  so.start();
  ham.start();
  ns.start();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const breathe = () => {
    const t = ctx.currentTime + 0.05;
    soG.gain.setValueAtTime(0.0001, t);
    soG.gain.linearRampToValueAtTime(0.3, t + 3.5);
    soG.gain.linearRampToValueAtTime(0.0001, t + 4.2);
    hamG.gain.setValueAtTime(0.0001, t + 3.8);
    hamG.gain.linearRampToValueAtTime(0.3, t + 4.6);
    hamG.gain.linearRampToValueAtTime(0.0001, t + CYCLE - 0.3);
    nG.gain.setValueAtTime(0.0001, t);
    nG.gain.linearRampToValueAtTime(0.05, t + 3.5);
    nG.gain.linearRampToValueAtTime(0.0001, t + 4);
    nG.gain.linearRampToValueAtTime(0.03, t + 6);
    nG.gain.linearRampToValueAtTime(0.0001, t + CYCLE - 0.3);
    timer = setTimeout(breathe, CYCLE * 1000);
  };
  breathe();
  return () => {
    if (timer) clearTimeout(timer);
    so.stop();
    ham.stop();
    ns.stop();
  };
}

export const soundEngine = new SoundEngine();
