"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { btn, card } from "@/features/shared/ui";
import { addPlace, buildPlan, estimateBudget, movePlace, planToText, removePlace, setDays, totalDays, type TripDays, type TripItem } from "./plan-logic";
import { yatraRoutes } from "./routes";
import { loadTrip, saveTrip } from "./store";
import type { BudgetBand, DayPart, PlaceView } from "./types";

const BANDS: BudgetBand[] = ["budget", "mid", "comfort"];
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Trip planner: pick places and days, get one day-by-day plan. Saved on this device; print, copy or share as text. */
export function Planner({ places }: { places: PlaceView[] }) {
  const s = useS();
  const { locale } = useI18n();
  const ids = useMemo(() => places.map((p) => p.id), [places]);
  const [items, setItems] = useState<TripItem[]>([]);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  const [band, setBand] = useState<BudgetBand>("mid");

  useEffect(() => {
    void loadTrip(ids).then((r) => {
      setItems(r.items);
      setReady(true);
    });
  }, [ids]);
  const update = (next: TripItem[]) => {
    setItems(next);
    void saveTrip(next).then(setSaved);
  };

  const plan = useMemo(() => buildPlan(items, places), [items, places]);
  const name = (id: string) => places.find((p) => p.id === id)!;
  const budget = estimateBudget(items, places, band);
  const text = () =>
    planToText(plan, {
      title: s("yatra.planner.textTitle", { days: totalDays(items) }),
      day: (n, place, k, of) => s("yatra.planner.textDay", { n, place, k, of }),
      part: Object.fromEntries((["morning", "afternoon", "evening"] as DayPart[]).map((k) => [k, s(`yatra.part.${k}`)])) as Record<DayPart, string>,
      footer: s("yatra.planner.textFooter"),
    });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      setMsg(s("yatra.planner.copied"));
    } catch {
      setMsg(s("yatra.planner.copyFail"));
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: s("yatra.planner.title"), text: text() });
    } catch {
      /* cancelled or unsupported */
    }
  };
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const free = places.filter((p) => !items.some((i) => i.placeId === p.id));

  return (
    <div className="flex flex-col gap-5">
      <Link href={yatraRoutes.list(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2 print:hidden">
        {s("yatra.back")}
      </Link>
      <header>
        <h1>{s("yatra.planner.title")}</h1>
        <p className="text-text-muted print:hidden">{s("yatra.planner.intro")}</p>
      </header>

      {ready && saved === false ? (
        <p role="status" className="text-small text-text-muted print:hidden">
          {s("yatra.planner.notSaved")}
        </p>
      ) : null}

      <section aria-labelledby="pl-pick" className={`${card} print:hidden`}>
        <h2 id="pl-pick" className="mb-2 text-h3">
          {s("yatra.planner.pick")}
        </h2>
        {free.length === 0 ? (
          <p className="text-text-muted">{s("yatra.planner.allAdded")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {free.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <span lang={p.name.lang}>{p.name.text}</span>
                <button type="button" className={btn.secondary} onClick={() => update(addPlace(items, p.id))}>
                  {s("yatra.planner.addNamed", { name: p.name.text })}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="pl-trip" className={card}>
        <h2 id="pl-trip" className="mb-2 text-h3">
          {s("yatra.planner.yourTrip")}
        </h2>
        {items.length === 0 ? (
          <p className="text-text-muted" data-testid="trip-empty">
            {s("yatra.planner.empty")}
          </p>
        ) : (
          <ol className="flex flex-col gap-3" data-testid="trip-items">
            {items.map((it, idx) => {
              const p = name(it.placeId);
              return (
                <li key={it.placeId} className="flex flex-wrap items-center gap-2 border-b border-divider pb-3 last:border-0">
                  <span className="flex-1 font-semibold" lang={p.name.lang}>
                    {p.name.text}
                  </span>
                  <label className="flex items-center gap-2 print:hidden">
                    <span className="text-small">{s("yatra.planner.daysHere")}</span>
                    <select
                      value={it.days}
                      onChange={(e) => update(setDays(items, it.placeId, Number(e.target.value) as TripDays))}
                      aria-label={s("yatra.planner.daysFor", { name: p.name.text })}
                      className="min-h-11 rounded-md border border-border-input bg-surface px-3"
                    >
                      {[1, 2, 3].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className="flex gap-1 print:hidden">
                    <button type="button" className={btn.ghost} disabled={idx === 0} onClick={() => update(movePlace(items, it.placeId, -1))} aria-label={s("yatra.planner.up", { name: p.name.text })}>
                      ↑
                    </button>
                    <button type="button" className={btn.ghost} disabled={idx === items.length - 1} onClick={() => update(movePlace(items, it.placeId, 1))} aria-label={s("yatra.planner.down", { name: p.name.text })}>
                      ↓
                    </button>
                    <button type="button" className={btn.ghost} onClick={() => update(removePlace(items, it.placeId))}>
                      {s("yatra.planner.remove")}
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {items.length > 0 ? (
          <p className="mt-3 font-semibold" data-testid="trip-total">
            {s("yatra.planner.total", { count: totalDays(items) })}
          </p>
        ) : null}
      </section>

      {plan.length > 0 ? (
        <>
          <section aria-labelledby="pl-plan" className={card} data-testid="trip-plan">
            <h2 id="pl-plan" className="mb-2 text-h3">
              {s("yatra.planner.plan")}
            </h2>
            <ol className="flex flex-col gap-4">
              {plan.map((d) => (
                <li key={d.dayNo}>
                  <h3 className="font-semibold">{s("yatra.planner.textDay", { n: d.dayNo, place: d.placeName, k: d.placeDay, of: d.ofDays })}</h3>
                  <ul className="mt-1 flex flex-col gap-1">
                    {d.parts.map((x, i) => {
                      const p = places.find((q) => q.id === d.placeId)!;
                      const lang = p.name.lang;
                      return (
                        <li key={i}>
                          <span className="font-semibold">{s(`yatra.part.${x.part}`)}: </span>
                          <span lang={lang}>{x.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="pl-budget" className={card}>
            <h2 id="pl-budget" className="mb-2 text-h3">
              {s("yatra.budget")}
            </h2>
            <div role="group" aria-label={s("yatra.budget")} className="mb-2 flex flex-wrap gap-2 print:hidden">
              {BANDS.map((b) => (
                <button key={b} type="button" className={btn.chip} aria-pressed={band === b} onClick={() => setBand(b)}>
                  {s(`yatra.band.${b}`)}
                </button>
              ))}
            </div>
            <p>
              {s("yatra.planner.estimate", { min: rupees(budget.min), max: rupees(budget.max) })} <span className="text-small text-text-muted">{s("yatra.indicative")}</span>
            </p>
          </section>

          <div className="flex flex-wrap gap-3 print:hidden">
            <button type="button" className={btn.primary} onClick={() => window.print()}>
              {s("yatra.planner.print")}
            </button>
            <button type="button" className={btn.secondary} onClick={() => void copy()}>
              {s("yatra.planner.copy")}
            </button>
            {canShare ? (
              <button type="button" className={btn.secondary} onClick={() => void share()}>
                {s("yatra.planner.share")}
              </button>
            ) : null}
          </div>
          <p role="status" className="text-small text-text-muted">
            {msg}
          </p>
        </>
      ) : null}
      <p className="text-small text-text-muted">{s("yatra.disclaimer")}</p>
    </div>
  );
}
