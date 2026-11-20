"use client";

/**
 * Breath player (E-08, FR-4, DS-5 §1, US-11/12/13). Only the orb moves; every
 * cue is also text. Timing comes from `engine.ts` (timestamp-driven).
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { SpeakerHighIcon } from "@phosphor-icons/react/dist/csr/SpeakerHigh";
import { SpeakerSlashIcon } from "@phosphor-icons/react/dist/csr/SpeakerSlash";
import { useI18n } from "@/i18n/client";
import type { BreathPhase, Technique } from "@/features/shared/content.server";
import { prefersReducedMotion } from "@/features/shared/device";
import { useS } from "@/features/shared/strings";
import { useDeviceValue } from "@/features/shared/use-device";
import { btn, card, ConfirmDialog } from "@/features/shared/ui";
import { canVibrate, chime, suspendAudio, unlockAudio, vibrate } from "./audio";
import { formatClock, positionAt, roundsFor, SessionClock, type BreathPosition } from "./engine";
import { useOnHidden, useSessionKeys, useWakeLock } from "./hooks";
import { readSessionQuery } from "./routes";
import { SessionComplete } from "./SessionComplete";
import { EnglishMark } from "@/components/ObservanceBody";
import { SourceLine } from "./SourceLine";
import { acknowledge, hasAcknowledged, readSound, recordSession, writeSound, type SoundSettings } from "./store";

type Phase = "intro" | "ready" | "settle" | "running" | "paused" | "returning" | "complete";

const MINUTES = [2, 3, 5, 10] as const;
const SETTLE_MS = 3000;
const REST = 0.6;
const FULL = 1;
const REDUCED = 0.8;

/** Orb scale at the start and end of phase `i` (DS-5 §1.2). */
function scales(pattern: readonly BreathPhase[], i: number): [number, number] {
  const p = pattern[i]!.phase;
  if (p === "inhale") return [REST, FULL];
  if (p === "exhale" || p === "hum") return [FULL, REST];
  const prev = pattern[(i - 1 + pattern.length) % pattern.length]!.phase;
  const v = prev === "inhale" ? FULL : REST;
  return [v, v];
}

export function BreathPlayer({ technique, caution }: { technique: Technique; caution: string }) {
  const s = useS();
  const { locale } = useI18n();
  const router = useRouter();
  const pattern = technique.pattern;

  const [phase, setPhase] = useDeviceValue<Phase>(() => (hasAcknowledged(technique.id) ? "ready" : "intro"), "ready");
  const [minutes, setMinutes] = useDeviceValue<number>(() => readSessionQuery(MINUTES, technique.defaultMinutes).minutes, technique.defaultMinutes);
  const [source] = useDeviceValue<"plan" | "free">(() => readSessionQuery(MINUTES, technique.defaultMinutes).source, "free");
  const [pos, setPos] = useState<BreathPosition | null>(null);
  const [settleLeft, setSettleLeft] = useState(3);
  const [announce, setAnnounce] = useState("");
  const [sound, setSound] = useDeviceValue<SoundSettings>(readSound, { chime: true, haptic: false, volume: 5 });
  const [reduced] = useDeviceValue(prefersReducedMotion, false);
  const [haptics] = useDeviceValue(canVibrate, false);
  const [totalRounds, setTotalRounds] = useState(1);
  const [endedAtMs, setEndedAtMs] = useState(0);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [muted, setMuted] = useState(false);
  const [result, setResult] = useState<{ minutes: number; saved: boolean } | null>(null);

  const clock = useRef(new SessionClock());
  const rounds = useRef(1);
  const settleEnd = useRef(0);
  const lastKey = useRef<string | null>(null);
  const orb = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);
  const soundRef = useRef(sound);
  const pauseBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    return () => {
      anim.current?.cancel();
      suspendAudio();
    };
  }, []);

  const label = useCallback((p: BreathPhase) => (p.phase === "hold" ? s("practice.hold") : s(p.labelKey)), [s]);

  const onPhaseStart = useCallback(
    (p: BreathPosition) => {
      const ph = pattern[p.phaseIndex]!;
      setAnnounce(label(ph));
      const snd = soundRef.current;
      if (snd.chime) chime(ph.phase === "inhale" ? "in" : ph.phase === "exhale" || ph.phase === "hum" ? "out" : "other");
      if (snd.haptic) vibrate();
      const el = orb.current;
      if (!el || reduced) return;
      const [a, b] = scales(pattern, p.phaseIndex);
      anim.current?.cancel();
      if (typeof el.animate !== "function") {
        el.style.transform = `scale(${b})`;
        return;
      }
      const an = el.animate([{ transform: `scale(${a})` }, { transform: `scale(${b})` }], {
        duration: p.phaseMs,
        easing: "cubic-bezier(.37,0,.63,1)",
        fill: "forwards",
      });
      an.currentTime = p.phaseElapsedMs;
      anim.current = an;
    },
    [pattern, label, reduced],
  );

  const finish = useCallback(
    async (natural: boolean) => {
      clock.current.pause();
      anim.current?.pause();
      const plannedSec = (rounds.current * pattern.reduce((x, p) => x + p.seconds, 0));
      const actualSec = natural ? plannedSec : clock.current.elapsed() / 1000;
      const r = await recordSession({ kind: "breath", refId: technique.id, plannedSec, actualSec, source });
      suspendAudio();
      if (r.completed) {
        if (orb.current && !reduced && typeof orb.current.animate === "function") {
          anim.current?.cancel();
          anim.current = orb.current.animate([{ transform: `scale(${REST})` }], { duration: 1200, fill: "forwards" });
        }
        setResult({ minutes: Math.max(1, Math.round(actualSec / 60)), saved: r.saved });
        setPhase("complete");
      } else {
        router.push(`/${locale}/practice/`);
      }
    },
    [pattern, technique.id, source, reduced, locale, router, setPhase],
  );

  // The 250 ms check (DS-5 §1.4): text follows the true second within 250 ms.
  useEffect(() => {
    if (phase !== "settle" && phase !== "running") return;
    const tick = () => {
      if (phase === "settle") {
        const left = settleEnd.current - performance.now();
        if (left > 0) {
          setSettleLeft(Math.ceil(left / 1000));
          return;
        }
        clock.current.start();
        lastKey.current = null;
        setPhase("running");
        return;
      }
      const p = positionAt(pattern, rounds.current, clock.current.elapsed());
      if (p.done) {
        void finish(true);
        return;
      }
      const key = `${p.round}-${p.phaseIndex}`;
      if (key !== lastKey.current) {
        lastKey.current = key;
        onPhaseStart(p);
      }
      setPos(p);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, pattern, onPhaseStart, finish, setPhase]);

  useEffect(() => {
    if (phase === "running") pauseBtn.current?.focus();
  }, [phase]);

  useWakeLock(phase === "running" || phase === "settle");

  const begin = async () => {
    rounds.current = roundsFor(pattern, minutes * 60);
    setTotalRounds(rounds.current);
    setPos(positionAt(pattern, rounds.current, 0));
    if (soundRef.current.chime) {
      const ok = await unlockAudio();
      if (!ok) setMuted(true);
    }
    settleEnd.current = performance.now() + SETTLE_MS;
    setSettleLeft(3);
    setAnnounce(s("practice.starting"));
    setPhase("settle");
  };

  const pause = useCallback((toReturning = false) => {
    if (phase === "settle") {
      setPhase("ready");
      return;
    }
    if (phase !== "running") return;
    clock.current.pause();
    anim.current?.pause();
    setPhase(toReturning ? "returning" : "paused");
    setAnnounce(s("breath.paused"));
  }, [phase, s, setPhase]);

  const resume = () => {
    // Restart the current phase from its beginning (gentler; DS-5 §1.3).
    const p = positionAt(pattern, rounds.current, clock.current.elapsed());
    clock.current.resume(p.phaseStartMs);
    lastKey.current = null;
    setPhase("running");
  };

  const askEnd = () => {
    if (phase === "running") pause();
    if (phase === "running" || phase === "paused" || phase === "returning") {
      setEndedAtMs(clock.current.elapsed());
      setConfirmEnd(true);
    }
  };

  useOnHidden(() => pause(true));
  useSessionKeys(
    phase === "running" || phase === "paused" || phase === "returning",
    () => (phase === "running" ? pause() : resume()),
    askEnd,
  );

  const toggleChime = () => {
    const next = { ...sound, chime: !sound.chime };
    setSound(next);
    writeSound(next);
    if (next.chime) void unlockAudio().then((ok) => !ok && setMuted(true));
  };
  const toggleHaptic = () => {
    const next = { ...sound, haptic: !sound.haptic };
    setSound(next);
    writeSound(next);
  };

  const inhale = pattern.find((p) => p.phase === "inhale")?.seconds ?? 4;
  const exhale = pattern.find((p) => p.phase === "exhale" || p.phase === "hum")?.seconds ?? 4;
  const rhythm = s("tech.rhythmValue", { in: inhale, out: exhale });
  const cur = pos ? pattern[pos.phaseIndex]! : null;
  const active = phase === "running" || phase === "paused" || phase === "returning" || phase === "settle";

  if (phase === "complete" && result) {
    return <SessionComplete kind="breath" minutes={result.minutes} saved={result.saved} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/practice/`} aria-label={s("practice.endA11y")} className={btn.icon} onClick={(e) => {
          if (active && phase !== "settle") {
            e.preventDefault();
            askEnd();
          }
        }}>
          <XIcon size={24} aria-hidden="true" />
        </Link>
        <h1 className="min-w-0 flex-1 text-[1.375rem] leading-[1.875rem] break-words">
          <span lang={technique.lang}>{technique.name}</span> · {s("common.minutesShort", { count: minutes })}
          {technique.lang === "en" ? <EnglishMark /> : null}
        </h1>
        <button
          type="button"
          className={btn.icon}
          aria-pressed={sound.chime}
          aria-label={s("breath.chime")}
          onClick={toggleChime}
        >
          {sound.chime ? <SpeakerHighIcon size={24} aria-hidden="true" /> : <SpeakerSlashIcon size={24} aria-hidden="true" />}
        </button>
      </div>

      {phase === "intro" || phase === "ready" ? <SourceLine source={technique.source} /> : null}

      {phase === "intro" ? (
        <section aria-labelledby="first-h" className="flex flex-col gap-4">
          <h2 id="first-h">{s("tech.firstTime")}</h2>
          <p>{technique.what}</p>
          <div>
            <h3 className="mb-1 font-semibold">{s("tech.how")}</h3>
            <ol className="list-decimal space-y-1 pl-6">
              {technique.steps.slice(0, 3).map((st) => (
                <li key={st}>{st}</li>
              ))}
            </ol>
          </div>
          {technique.skipIf.length ? (
            <div>
              <h3 className="mb-1 font-semibold">{s("tech.skipIf")}</h3>
              <ul className="list-disc space-y-1 pl-6">
                {technique.skipIf.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div role="note" className="rounded-md bg-warning-tint p-4 text-text">
            <h3 className="mb-1 font-semibold">{s("safety.title")}</h3>
            <p>{caution}</p>
          </div>
          <button
            type="button"
            className={btn.primary}
            onClick={() => {
              acknowledge(technique.id);
              setPhase("ready");
            }}
          >
            {s("onb.safety.cta")}
          </button>
        </section>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3">
            <div
              aria-hidden="true"
              className="relative flex items-center justify-center"
              style={{ width: "min(240px, 66vw, 34vh)", height: "min(240px, 66vw, 34vh)" }}
            >
              <div className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-orb-guide" />
              <div
                ref={orb}
                className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-orb-ring bg-orb-fill"
                style={{
                  transform: `scale(${reduced ? REDUCED : REST})`,
                  willChange: phase === "running" && !reduced ? "transform" : undefined,
                }}
              >
                <div className="h-[28%] w-[28%] rounded-full bg-orb-core" />
              </div>
            </div>

            {cur?.side && phase !== "ready" ? (
              <p className="rounded-full border border-border-input px-3 py-1 text-[0.875rem] font-semibold">
                <span aria-hidden="true">{cur.side === "left" ? "L" : "R"} · </span>
                {s(`practice.side.${cur.side}`)}
              </p>
            ) : null}

            <p className="min-h-[52px] text-center text-[2.25rem] leading-[3.25rem] font-semibold" lang={locale}>
              {phase === "ready"
                ? ""
                : phase === "settle"
                  ? s("breath.getReady", { seconds: settleLeft })
                  : phase === "paused"
                    ? s("breath.paused")
                    : phase === "returning"
                      ? s("breath.resumePrompt")
                      : cur
                        ? label(cur)
                        : ""}
            </p>
            {phase === "ready" ? <p className="text-center text-text-muted">{s("practice.ready")}</p> : null}

            {phase === "running" && pos ? (
              <>
                <p className="text-[1.75rem] leading-9 font-semibold tabular-nums" aria-hidden="true">
                  {pos.phaseSecondsLeft}
                </p>
                {reduced ? (
                  <ol aria-hidden="true" className="flex gap-1">
                    {Array.from({ length: Math.round(pos.phaseMs / 1000) }, (_, i) => (
                      <li
                        key={i}
                        className={`h-3 w-6 rounded-sm border ${i < Math.floor(pos.phaseElapsedMs / 1000) + 1 ? "border-primary bg-primary" : "border-border-input"}`}
                      />
                    ))}
                  </ol>
                ) : null}
              </>
            ) : null}

            {pos && phase !== "ready" ? (
              <p className="text-[0.875rem] leading-5 text-text-muted">
                {rhythm} · {s("practice.roundOf", { n: pos.round, total: totalRounds })} ·{" "}
                {s("common.timeLeft", { time: formatClock(pos.sessionRemainingMs) })}
              </p>
            ) : null}
          </div>

          {/* One polite announcement per phase; counts are never announced (DS-5 §1.6). */}
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>

          {muted ? (
            <p role="status" className="rounded-md bg-warning-tint p-3 text-center">
              {s("timer.muted")}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-center gap-4">
            {phase === "ready" ? (
              <>
                <fieldset className="flex w-full flex-wrap justify-center gap-2">
                  <legend className="sr-only">{s("practice.duration")}</legend>
                  {MINUTES.map((m) => (
                    <button key={m} type="button" className={btn.chip} aria-pressed={m === minutes} onClick={() => setMinutes(m)}>
                      {s("common.minutesShort", { count: m })}
                    </button>
                  ))}
                </fieldset>
                <button type="button" autoFocus className={btn.primary} onClick={() => void begin()}>
                  {s("practice.begin")}
                </button>
              </>
            ) : phase === "running" || phase === "settle" ? (
              <>
                <button ref={pauseBtn} type="button" className={btn.primary} onClick={() => pause()}>
                  {s("common.pause")}
                </button>
                {phase === "running" ? (
                  <button type="button" className={btn.secondary} onClick={askEnd}>
                    {s("common.end")}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <button type="button" autoFocus className={btn.primary} onClick={resume}>
                  {s("common.resume")}
                </button>
                <button type="button" className={btn.secondary} onClick={askEnd}>
                  {s("common.end")}
                </button>
              </>
            )}
          </div>

          {phase === "ready" ? (
            <details className={card}>
              <summary className="min-h-11 cursor-pointer font-semibold">{s("practice.safetyLink")}</summary>
              <p className="mt-2">{caution}</p>
              <ol className="mt-3 list-decimal space-y-1 pl-6">
                {technique.steps.map((st) => (
                  <li key={st}>{st}</li>
                ))}
              </ol>
            </details>
          ) : (
            <p className="rounded-md bg-warning-tint p-3 text-center text-[0.875rem] leading-5">{s("safety.short")}</p>
          )}

          {phase === "ready" && haptics ? (
            <label className="flex min-h-11 items-center justify-center gap-3">
              <input type="checkbox" checked={sound.haptic} onChange={toggleHaptic} className="h-5 w-5" />
              {s("practice.haptic")}
            </label>
          ) : null}
          {phase === "ready" ? <p className="text-center text-[0.875rem] leading-5 text-text-muted">{s("breath.screenOn")}</p> : null}
        </>
      )}

      <ConfirmDialog
        open={confirmEnd}
        title={s("breath.endTitle")}
        body={
          <>
            <p>{s("practice.endedEarly", { time: formatClock(endedAtMs) })}</p>
            <p>{s("breath.endBody")}</p>
          </>
        }
        confirmLabel={s("breath.endConfirm")}
        cancelLabel={s("breath.endKeep")}
        onCancel={() => {
          setConfirmEnd(false);
          resume();
        }}
        onConfirm={() => {
          setConfirmEnd(false);
          void finish(false);
        }}
      />
    </div>
  );
}
