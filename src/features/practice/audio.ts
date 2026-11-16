/**
 * Sounds made on the device with Web Audio (E-07*, FR-5.3/5.4, L5 3.3).
 * No recordings, no downloads, no voice. Ideas ported (and cut down) from
 * the prototype's sound-engine.ts.
 *
 * - chime(): soft sine at each breath phase (DS-5 §1.5), about −18 dBFS.
 * - bell(): start / end / interval bell for the timer.
 * - ambience "rain": filtered pink noise with a slow swell.
 * - ambience "river": band-passed brown noise with a wandering centre.
 *
 * The AudioContext is created lazily on the first call, which must follow a
 * user tap (autoplay rules). With sound off, nothing here is ever called, so
 * no context is created (DS-5 §5 check 7).
 */
export type Ambience = "silence" | "rain" | "river";

const AMB_FADE_S = 2;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let amb: { stop: () => void; gain: GainNode } | null = null;
let volume = 0.5;
const noiseCache = new Map<string, AudioBuffer>();

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);
  return ctx;
}

/** Resume after a tap. Returns false if audio could not start (muted / blocked). */
export async function unlockAudio(): Promise<boolean> {
  const c = getCtx();
  if (!c) return false;
  try {
    if (c.state !== "running") await c.resume();
  } catch {
    /* ignore */
  }
  return c.state === "running";
}

function tone(freq: number, dur: number, peak: number, when = 0): void {
  const c = getCtx();
  if (!c || !master) return;
  const t0 = c.currentTime + when;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = freq;
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

/** Phase chime: higher for breathing in, lower for out. */
export function chime(kind: "in" | "out" | "other"): void {
  const f = kind === "in" ? 528 : kind === "out" ? 396 : 440;
  tone(f, 0.45, 0.125); // ≈ −18 dBFS
}

/** Singing-bowl-like bell: a few inharmonic partials with a long decay. */
export function bell(): void {
  const base = 220;
  tone(base, 4, 0.16);
  tone(base * 2.76, 2.6, 0.05);
  tone(base * 5.4, 1.4, 0.02);
}

function noiseBuffer(c: AudioContext, color: "pink" | "brown"): AudioBuffer {
  const key = `${color}-${c.sampleRate}`;
  const hit = noiseCache.get(key);
  if (hit) return hit;
  const len = Math.floor(c.sampleRate * 4);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  if (color === "pink") {
    // Paul Kellet's economy pink filter.
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
    }
  } else {
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  // Crossfade the loop seam so it doesn't click.
  const fade = Math.floor(c.sampleRate * 0.05);
  for (let i = 0; i < fade; i++) {
    const a = i / fade;
    d[i] = d[i]! * a + d[len - fade + i]! * (1 - a);
  }
  noiseCache.set(key, buf);
  return buf;
}

const ambGainFor = (v: number) => 0.6 * v;

export function startAmbience(kind: Ambience): void {
  stopAmbience(true);
  if (kind === "silence") return;
  const c = getCtx();
  if (!c || !master) return;
  const nodes: AudioScheduledSourceNode[] = [];
  const out = c.createGain();
  out.gain.setValueAtTime(0, c.currentTime);
  out.gain.linearRampToValueAtTime(ambGainFor(volume), c.currentTime + AMB_FADE_S);
  out.connect(master);

  const src = c.createBufferSource();
  src.loop = true;
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  if (kind === "rain") {
    src.buffer = noiseBuffer(c, "pink");
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 400;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4800;
    const swell = c.createGain();
    swell.gain.value = 0.7;
    src.connect(hp).connect(lp).connect(swell).connect(out);
    lfo.frequency.value = 0.13;
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain).connect(swell.gain);
  } else {
    src.buffer = noiseBuffer(c, "brown");
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 700;
    bp.Q.value = 0.7;
    src.connect(bp).connect(out);
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 320;
    lfo.connect(lfoGain).connect(bp.frequency);
  }
  src.start();
  lfo.start();
  nodes.push(src, lfo);
  amb = {
    gain: out,
    stop: () => {
      for (const n of nodes) {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      }
      out.disconnect();
    },
  };
}

/** Stop the ambience. `fast` = within 1 s (pause, end, leaving; US-15). */
export function stopAmbience(fast = false): void {
  const c = ctx;
  const a = amb;
  amb = null;
  if (!c || !a) return;
  const t = fast ? 0.3 : AMB_FADE_S;
  a.gain.gain.cancelScheduledValues(c.currentTime);
  a.gain.gain.setValueAtTime(a.gain.gain.value, c.currentTime);
  a.gain.gain.linearRampToValueAtTime(0, c.currentTime + t);
  setTimeout(a.stop, t * 1000 + 50);
}

/** 0..10 steps (WCAG 2.5.7: steppers, no drag-only slider). */
export function setVolume(step: number): void {
  volume = Math.min(10, Math.max(0, step)) / 10;
  if (ctx && amb) amb.gain.gain.setTargetAtTime(ambGainFor(volume), ctx.currentTime, 0.1);
}

/** Release the audio device when leaving the practice screens. */
export function suspendAudio(): void {
  stopAmbience(true);
  if (ctx && ctx.state === "running") setTimeout(() => void ctx?.suspend().catch(() => {}), 400);
}

export function vibrate(ms = 12): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* unsupported */
  }
}

export const canVibrate = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
