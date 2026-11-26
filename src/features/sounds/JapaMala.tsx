"use client";

/** Japa mala: 108-bead counter with a large tap area. The count is kept on this device (IndexedDB). */
import { useCallback, useEffect, useRef, useState } from "react";
import { Mandala } from "@/components/Mandala";
import { readLocal, writeLocal } from "@/features/shared/device";
import { useS } from "@/features/shared/strings";
import { btn, card, ConfirmDialog } from "@/features/shared/ui";
import { BEADS_PER_MALA, loadCount, saveCount, tap, view } from "./japa";

const VIBRATE_KEY = "japa.vibrate";
const R = 88;
const DOTS = Array.from({ length: BEADS_PER_MALA }, (_, i) => {
  const a = (i / BEADS_PER_MALA) * Math.PI * 2 - Math.PI / 2;
  return { x: 100 + R * Math.cos(a), y: 100 + R * Math.sin(a) };
});

export function JapaMala() {
  const s = useS();
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(true);
  const [done, setDone] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [vibrate, setVibrate] = useState(false);
  const [canVibrate, setCanVibrate] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadCount().then((r) => {
      if (!alive) return;
      countRef.current = r.count;
      setCount(r.count);
      setSaved(r.saved);
      setLoaded(true);
      setVibrate(readLocal<boolean>(VIBRATE_KEY, false) === true);
      setCanVibrate(typeof navigator.vibrate === "function");
    });
    return () => {
      alive = false;
    };
  }, []);

  const buzz = useCallback(
    (pattern: number | number[]) => {
      if (vibrate && typeof navigator.vibrate === "function") navigator.vibrate(pattern);
    },
    [vibrate],
  );

  const persist = (n: number) => void saveCount(n).then(setSaved);

  const onTap = () => {
    const r = tap(countRef.current);
    countRef.current = r.count;
    setCount(r.count);
    persist(r.count);
    if (r.completed) {
      setDone(true);
      buzz([90, 70, 90, 70, 260]);
    } else {
      buzz(12);
    }
  };

  const reset = () => {
    countRef.current = 0;
    setCount(0);
    setDone(false);
    setConfirm(false);
    persist(0);
  };

  const v = view(count);

  return (
    <section aria-labelledby="japa-h" className="flex flex-col gap-4">
      <div>
        <h2 id="japa-h">{s("japa.title")}</h2>
        <p className="text-text-muted">{s("japa.sub")}</p>
      </div>

      {done ? (
        <div role="status" className={`${card} flex flex-col items-center gap-3 text-center`}>
          <Mandala className="size-28 text-[var(--accent)]" />
          <h3 className="text-h2">{s("japa.complete")}</h3>
          <p className="text-text-muted">{s("japa.completeBody")}</p>
          <p className="font-semibold">{s("japa.malas", { count: v.malas })}</p>
          <button type="button" className={btn.primary} onClick={() => setDone(false)}>
            {s("japa.continue")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid="japa-tap"
          disabled={!loaded}
          onClick={onTap}
          aria-label={s("japa.tapA11y", { n: v.beads })}
          className="relative mx-auto aspect-square w-[min(100%,20rem)] touch-manipulation select-none rounded-full border border-divider shadow-elev-1 bg-surface text-text active:bg-primary-tint disabled:opacity-60"
        >
          <svg aria-hidden="true" focusable="false" viewBox="0 0 200 200" className="absolute inset-0 size-full">
            {DOTS.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={i < v.beads ? 3.4 : 2.4}
                className={i < v.beads ? "fill-[var(--accent)]" : "fill-[var(--divider)]"}
              />
            ))}
          </svg>
          <span className="relative flex h-full flex-col items-center justify-center gap-1">
            <span data-testid="japa-beads" className="text-[3.5rem] font-semibold leading-none">
              {v.beads}
            </span>
            <span className="text-text-muted">{s("japa.beadOf", { n: v.beads })}</span>
          </span>
        </button>
      )}

      <p className="text-center text-text-muted" data-testid="japa-malas">
        {s("japa.malas", { count: v.malas })} · {s("japa.total", { n: v.total })}
      </p>

      {!saved ? <p className="rounded-md bg-surface-2 p-3 text-text-muted">{s("japa.notSaved")}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {canVibrate ? (
          <label className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              className="size-6 accent-[var(--accent)]"
              checked={vibrate}
              onChange={(e) => {
                setVibrate(e.target.checked);
                writeLocal(VIBRATE_KEY, e.target.checked);
                if (e.target.checked) navigator.vibrate?.(20);
              }}
            />
            <span>{s("japa.vibrate")}</span>
          </label>
        ) : (
          <span />
        )}
        <button type="button" className={btn.secondary} onClick={() => setConfirm(true)} disabled={count === 0}>
          {s("japa.reset")}
        </button>
      </div>

      <ConfirmDialog
        open={confirm}
        danger
        title={s("japa.resetTitle")}
        body={s("japa.resetBody")}
        confirmLabel={s("japa.resetConfirm")}
        cancelLabel={s("common.cancel")}
        onConfirm={reset}
        onCancel={() => setConfirm(false)}
      />
    </section>
  );
}
