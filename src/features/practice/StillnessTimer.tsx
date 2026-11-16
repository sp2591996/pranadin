"use client";

/** Meditation timer (E-08 + E-07*, FR-5, DS-5 §2, US-14/15). */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { MinusIcon } from "@phosphor-icons/react/dist/csr/Minus";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { useI18n } from "@/i18n/client";
import type { Meditation } from "@/features/shared/content.server";
import { useS } from "@/features/shared/strings";
import { useDeviceValue } from "@/features/shared/use-device";
import { btn, card, ConfirmDialog } from "@/features/shared/ui";
import { bell, setVolume, startAmbience, stopAmbience, suspendAudio, unlockAudio, type Ambience } from "./audio";
import { formatClock, SessionClock } from "./engine";
import { useOnHidden, useSessionKeys, useWakeLock } from "./hooks";
import { readSessionQuery } from "./routes";
import { SessionComplete } from "./SessionComplete";
import { readSound, recordSession, writeSound } from "./store";

type Phase = "ready" | "settle" | "running" | "paused" | "returning" | "complete";

const PLAN_MINUTES = [2, 3, 5, 6, 10, 13, 15];
const FREE_MINUTES = [3, 5, 10, 15];
const AMBIENCES: Ambience[] = ["silence", "rain", "river"];
const SETTLE_MS = 3000;
const INTERVAL_MS = 120_000;
const R = 110;
const CIRC = 2 * Math.PI * R;

export function StillnessTimer({ meditation, silentTitle, silentGuidance, refId }: {
  meditation: Meditation | null;
  silentTitle: string;
  silentGuidance: string;
  refId: string;
}) {
  const s = useS();
  const { locale } = useI18n();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("ready");
  const [minutes, setMinutes] = useDeviceValue(() => readSessionQuery(PLAN_MINUTES, 5).minutes, 5);
  const [source] = useDeviceValue<"plan" | "free">(() => readSessionQuery(PLAN_MINUTES, 5).source, "free");
  const [endedAtMs, setEndedAtMs] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [settleLeft, setSettleLeft] = useState(3);
  const [ambience, setAmbience] = useState<Ambience>("silence");
  const [vol, setVol] = useDeviceValue(() => readSound().volume, 5);
  const [intervalBell, setIntervalBell] = useState(false);
  const [showGuidance, setShowGuidance] = useState(true);
  const [announce, setAnnounce] = useState("");
  const [ringLabel, setRingLabel] = useState("");
  const [muted, setMuted] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [result, setResult] = useState<{ minutes: number; saved: boolean } | null>(null);

  const clock = useRef(new SessionClock());
  const settleEnd = useRef(0);
  const marks = useRef({ half: false, oneMin: false, lastBell: 0, lastLabel: -1, guideHidden: false });
  const pauseBtn = useRef<HTMLButtonElement>(null);
  const totalMs = minutes * 60_000;

  useEffect(() => {
    return () => suspendAudio();
  }, []);

  const label = useCallback(
    (ms: number) => {
      const sec = Math.max(0, Math.ceil(ms / 1000));
      return s("practice.timeLeftA11y", { minutes: Math.floor(sec / 60), seconds: sec % 60 });
    },
    [s],
  );

  const finish = useCallback(
    async (natural: boolean) => {
      clock.current.pause();
      stopAmbience(true);
      const actualSec = natural ? totalMs / 1000 : clock.current.elapsed() / 1000;
      if (natural) bell();
      const r = await recordSession({ kind: "stillness", refId, plannedSec: totalMs / 1000, actualSec, source });
      if (r.completed) {
        setResult({ minutes: Math.max(1, Math.round(actualSec / 60)), saved: r.saved });
        setPhase("complete");
        setTimeout(suspendAudio, 4500); // let the end bell ring out
      } else {
        suspendAudio();
        router.push(`/${locale}/practice/`);
      }
    },
    [totalMs, refId, source, locale, router],
  );

  useEffect(() => {
    if (phase !== "settle" && phase !== "running") return;
    const tick = () => {
      if (phase === "settle") {
        const left = settleEnd.current - performance.now();
        if (left > 0) return setSettleLeft(Math.ceil(left / 1000));
        clock.current.start();
        marks.current = { half: false, oneMin: false, lastBell: 0, lastLabel: -1, guideHidden: false };
        bell();
        startAmbience(ambience);
        setPhase("running");
        return;
      }
      const e = clock.current.elapsed();
      if (e >= totalMs) return void finish(true);
      setElapsedSec(Math.floor(e / 1000)); // ring steps once per second (DS-5 §2.2)
      const left = totalMs - e;
      const m = marks.current;
      // Hide the guidance after the first 20 s so the screen stays quiet (DS-5 §2.1).
      if (!m.guideHidden && e >= 20_000) {
        m.guideHidden = true;
        setShowGuidance(false);
      }
      const slot = Math.floor(e / 30_000);
      if (slot !== m.lastLabel) {
        m.lastLabel = slot;
        setRingLabel(label(left));
      }
      if (!m.half && e >= totalMs / 2) {
        m.half = true;
        setAnnounce(s("practice.halfway"));
      }
      if (!m.oneMin && totalMs > 120_000 && left <= 60_000) {
        m.oneMin = true;
        setAnnounce(s("practice.oneMinute"));
      }
      if (intervalBell && left > 5_000) {
        const n = Math.floor(e / INTERVAL_MS);
        if (n > m.lastBell) {
          m.lastBell = n;
          bell();
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, totalMs, ambience, intervalBell, finish, label, s]);

  useEffect(() => {
    if (phase === "running") pauseBtn.current?.focus();
  }, [phase]);

  useWakeLock(phase === "running" || phase === "settle");

  const begin = async () => {
    const ok = await unlockAudio();
    if (!ok) setMuted(true);
    setVolume(vol);
    setElapsedSec(0);
    setRingLabel(label(totalMs));
    settleEnd.current = performance.now() + SETTLE_MS;
    setSettleLeft(3);
    setAnnounce(s("practice.starting"));
    setPhase("settle");
  };

  const pause = useCallback(
    (toReturning = false) => {
      if (phase === "settle") return setPhase("ready");
      if (phase !== "running") return;
      clock.current.pause();
      stopAmbience(true); // within 1 s (US-15)
      setPhase(toReturning ? "returning" : "paused");
      setAnnounce(s("breath.paused"));
    },
    [phase, s],
  );

  const resume = () => {
    clock.current.resume();
    startAmbience(ambience);
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
  useSessionKeys(phase === "running" || phase === "paused" || phase === "returning", () => (phase === "running" ? pause() : resume()), askEnd);

  const changeAmbience = (a: Ambience) => {
    setAmbience(a);
    if (phase === "running") {
      void unlockAudio().then(() => startAmbience(a));
    }
  };
  const changeVol = (d: number) => {
    const v = Math.min(10, Math.max(0, vol + d));
    setVol(v);
    setVolume(v);
    writeSound({ ...readSound(), volume: v });
  };


  if (phase === "complete" && result) return <SessionComplete kind="stillness" minutes={result.minutes} saved={result.saved} />;

  const title = meditation?.title ?? silentTitle;
  const guidance = meditation?.guidance ?? [silentGuidance];
  const progress = phase === "ready" ? 0 : Math.min(1, (elapsedSec * 1000) / totalMs);
  const leftMs = phase === "ready" ? totalMs : totalMs - elapsedSec * 1000;
  const cue = meditation?.cues.filter((c) => c.at > 0 && progress >= c.at).at(-1);
  const active = phase !== "ready";
  const freeChoices = FREE_MINUTES.includes(minutes) ? FREE_MINUTES : [...FREE_MINUTES, minutes].sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}/practice/`}
          aria-label={s("practice.endA11y")}
          className={btn.icon}
          onClick={(e) => {
            if (active && phase !== "settle") {
              e.preventDefault();
              askEnd();
            }
          }}
        >
          <XIcon size={24} aria-hidden="true" />
        </Link>
        <h1 className="flex-1 text-[22px] leading-[30px]">
          {title} · {s("common.minutesShort", { count: minutes })}
        </h1>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative" style={{ width: "min(240px, 66vw, 34vh)", height: "min(240px, 66vw, 34vh)" }}>
          <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90" role="img" aria-label={ringLabel || label(leftMs)}>
            <circle cx="120" cy="120" r={R} fill="none" stroke="var(--timer-track)" strokeWidth="6" />
            <circle
              cx="120"
              cy="120"
              r={R}
              fill="none"
              stroke="var(--timer-progress)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
            />
          </svg>
          <p aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-display text-[56px] leading-[60px] font-semibold tabular-nums">
            {formatClock(leftMs)}
          </p>
        </div>
        <p className="min-h-7 text-center text-[18px] leading-7">
          {phase === "settle"
            ? s("breath.getReady", { seconds: settleLeft })
            : phase === "paused"
              ? `${s("breath.paused")} · ${s("common.timeLeft", { time: formatClock(leftMs) })}`
              : phase === "returning"
                ? s("breath.resumePrompt")
                : (cue?.text ?? "")}
        </p>
      </div>

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
          <button type="button" autoFocus className={btn.primary} onClick={() => void begin()}>
            {s("common.start")}
          </button>
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
        <fieldset className="flex flex-wrap justify-center gap-2">
          <legend className="mb-2 w-full text-center font-semibold">{s("practice.duration")}</legend>
          {freeChoices.map((m) => (
            <button key={m} type="button" className={btn.chip} aria-pressed={m === minutes} onClick={() => setMinutes(m)}>
              {s("common.minutesShort", { count: m })}
            </button>
          ))}
        </fieldset>
      ) : null}

      <section className={card} aria-labelledby="amb-h">
        <h2 id="amb-h" className="mb-2 text-[18px] leading-[26px]">
          {s("practice.ambience")}
        </h2>
        <div role="radiogroup" aria-labelledby="amb-h" className="flex flex-wrap gap-2">
          {AMBIENCES.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={a === ambience} className={btn.chip} onClick={() => changeAmbience(a)}>
              {s(`ambience.${a}`)}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="flex-1 text-[14px] leading-5">{s("a11y.volume")}</span>
          <button type="button" className={btn.icon} aria-label={s("a11y.decrease")} onClick={() => changeVol(-1)} disabled={vol <= 0}>
            <MinusIcon size={20} aria-hidden="true" />
          </button>
          <span className="w-10 text-center tabular-nums" aria-live="polite" aria-label={s("practice.volumeValue", { value: vol })}>
            {vol}
          </span>
          <button type="button" className={btn.icon} aria-label={s("a11y.increase")} onClick={() => changeVol(1)} disabled={vol >= 10}>
            <PlusIcon size={20} aria-hidden="true" />
          </button>
        </div>
        <label className="mt-3 flex min-h-11 items-center gap-3">
          <input type="checkbox" role="switch" checked={intervalBell} onChange={(e) => setIntervalBell(e.target.checked)} className="h-5 w-5" />
          {s("timer.intervalBell")} · {s("timer.intervalEvery", { minutes: 2 })}
        </label>
        <p className="mt-2 text-[14px] leading-5 text-text-muted">{s("practice.ambienceNote")}</p>
      </section>

      <section className={card} aria-labelledby="guide-h">
        <div className="flex items-center justify-between gap-2">
          <h2 id="guide-h" className="text-[18px] leading-[26px]">
            {s("timer.focus")}
          </h2>
          <button type="button" className={btn.ghost} aria-expanded={showGuidance} onClick={() => setShowGuidance((v) => !v)}>
            {showGuidance ? s("timer.hideGuidance") : s("timer.showGuidance")}
          </button>
        </div>
        {showGuidance ? (
          <div className="mt-2 flex flex-col gap-2 text-[18px] leading-7">
            {guidance.map((g) => (
              <p key={g}>{g}</p>
            ))}
            {meditation?.closing ? <p className="text-text-muted">{meditation.closing}</p> : null}
            {meditation?.note ? <p className="text-[14px] leading-5 text-text-muted">{meditation.note}</p> : null}
          </div>
        ) : null}
      </section>

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
