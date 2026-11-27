"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { Mandala } from "@/components/Mandala";
import { useI18n } from "@/i18n/client";
import { formatDateKey } from "@/i18n/format";
import type { FestivalTradition } from "@/features/festivals/types";
import { useS } from "@/features/shared/strings";
import { btn } from "@/features/shared/ui";
import {
  MAX_ITEMS,
  addPlace,
  buildPlan,
  estimateBudget,
  movePlace,
  planToText,
  removePlace,
  setDays,
  totalDays,
  type TripDays,
  type TripItem,
} from "./plan-logic";
import { STARTERS, addDaysKey, seasonWarnings } from "./plan-extras";
import { yatraRoutes } from "./routes";
import { loadTrip, saveTrip } from "./store";
import { PlannerIcon } from "./PlannerIcon";
import { monthName } from "./month";
import type { BudgetBand, DayPart, PlaceView, Txt } from "./types";

const BANDS: BudgetBand[] = ["budget", "mid", "comfort"];
const DAYS: TripDays[] = [1, 2, 3];
const PART_ICON: Record<DayPart, "Sun" | "SunDim" | "SunHorizon"> = {
  morning: "SunHorizon",
  afternoon: "Sun",
  evening: "SunDim",
};
const PREVIEW = 9;
const SETTINGS_KEY = "pranadin.tripSettings";
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

interface Settings {
  start: string;
  travellers: number;
  band: BudgetBand;
}
const DEFAULTS: Settings = { start: "", travellers: 2, band: "mid" };

function readSettings(): Settings {
  try {
    const raw = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) ?? "{}",
    ) as Partial<Settings>;
    return {
      start:
        typeof raw.start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.start)
          ? raw.start
          : "",
      travellers:
        Number.isInteger(raw.travellers) &&
        raw.travellers! >= 1 &&
        raw.travellers! <= 20
          ? raw.travellers!
          : 2,
      band: BANDS.includes(raw.band as BudgetBand)
        ? (raw.band as BudgetBand)
        : "mid",
    };
  } catch {
    return DEFAULTS;
  }
}

const T = ({ t, className = "" }: { t: Txt; className?: string }) => (
  <span lang={t.lang} className={className}>
    {t.text}
  </span>
);

/** Square place photo, or a branded letter tile when there is no photo yet. */
function Thumb({ p, className }: { p: PlaceView; className: string }) {
  const ph = p.photos[0];
  if (!ph)
    return (
      <span
        aria-hidden="true"
        className={`brand-earth flex items-center justify-center font-display text-[1.5rem] font-bold text-[#F5B22E] ${className}`}
      >
        {p.name.text.slice(0, 1)}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/yatra/${p.id}/${ph.file}`}
      alt=""
      loading="lazy"
      className={`object-cover ${className}`}
    />
  );
}

function StepTitle({
  n,
  title,
  sub,
  id,
}: {
  n: number;
  title: string;
  sub?: string;
  id: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span
        aria-hidden="true"
        className="brand-saffron flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[1.125rem] font-bold text-white"
      >
        {n}
      </span>
      <div>
        <h2
          id={id}
          className="font-display text-[1.625rem] font-semibold leading-tight"
        >
          {title}
        </h2>
        {sub && <p className="text-small text-text-muted">{sub}</p>}
      </div>
    </div>
  );
}

/** Trip planner (D-037): ready trips, photo picker, route with day buttons, dated plan, group cost and season check. */
export function Planner({ places }: { places: PlaceView[] }) {
  const s = useS();
  const { t, locale } = useI18n();
  const ids = useMemo(() => places.map((p) => p.id), [places]);
  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const [items, setItems] = useState<TripItem[]>([]);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  const [cfg, setCfg] = useState<Settings>(DEFAULTS);
  const [query, setQuery] = useState("");
  const [trad, setTrad] = useState<FestivalTradition | "all">("all");
  const [showAll, setShowAll] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    void loadTrip(ids).then((r) => {
      setItems(r.items);
      setCfg(readSettings());
      setCanShare(typeof navigator.share === "function");
      setReady(true);
    });
  }, [ids]);

  const update = (next: TripItem[]) => {
    setItems(next);
    void saveTrip(next).then(setSaved);
  };
  const updateCfg = (patch: Partial<Settings>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      /* private mode: keep for this visit only */
    }
  };

  const plan = useMemo(() => buildPlan(items, places), [items, places]);
  const days = totalDays(items);
  const cost = estimateBudget(items, places, cfg.band);
  const group = {
    min: cost.min * cfg.travellers,
    max: cost.max * cfg.travellers,
  };
  const warnings = cfg.start ? seasonWarnings(plan, places, cfg.start) : [];
  const dateOf = (n: number) => {
    const k = cfg.start ? addDaysKey(cfg.start, n - 1) : null;
    return k
      ? formatDateKey(k, locale, {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : null;
  };
  const endKey = cfg.start && days ? addDaysKey(cfg.start, days - 1) : null;

  const starters = useMemo(
    () =>
      STARTERS.map((x) => ({
        ...x,
        items: x.items.filter((i) => byId.has(i.placeId)),
      })).filter((x) => x.items.length >= 2),
    [byId],
  );
  const traditions = useMemo(
    () => [...new Set(places.flatMap((p) => p.traditions))],
    [places],
  );
  const q = query.trim().toLowerCase();
  const matches = places.filter(
    (p) =>
      !items.some((i) => i.placeId === p.id) &&
      (trad === "all" || p.traditions.includes(trad)) &&
      (!q ||
        p.name.text.toLowerCase().includes(q) ||
        p.state.text.toLowerCase().includes(q) ||
        p.id.includes(q)),
  );
  const shown = showAll || q ? matches : matches.slice(0, PREVIEW);
  const full = items.length >= MAX_ITEMS;

  const text = () =>
    planToText(plan, {
      title: s("yatra.planner.textTitle", { days }),
      day: (n, place, k, of) => s("yatra.planner.textDay", { n, place, k, of }),
      part: Object.fromEntries(
        (["morning", "afternoon", "evening"] as DayPart[]).map((k) => [
          k,
          s(`yatra.part.${k}`),
        ]),
      ) as Record<DayPart, string>,
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

  const stat = "rounded-2xl bg-white/10 px-4 py-3";
  const darkBtn =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/30 px-4 text-small font-semibold text-white hover:bg-white/10";

  return (
    <div className="wide flex flex-col gap-6">
      <Link
        href={yatraRoutes.list(locale)}
        className="inline-flex min-h-11 items-center gap-1 self-start text-primary underline underline-offset-2 print:hidden"
      >
        {s("yatra.back")}
      </Link>

      {/* ---------- Hero with live numbers ---------- */}
      <header className="brand-earth brand-glow relative isolate -mx-4 overflow-hidden px-5 py-8 text-white sm:mx-0 sm:rounded-[var(--r-xl)] sm:px-8 print:bg-transparent print:text-black">
        <Mandala className="slow-spin absolute -right-20 -top-20 -z-10 h-[340px] w-[340px] text-[#F3C35B] opacity-20 print:hidden" />
        <p className="flex items-center gap-2 text-small font-semibold text-[#F3D9A4]">
          <PlannerIcon name="MapTrifold" size={18} />
          {s("yatra.title")}
        </p>
        <h1 className="mt-1 font-display text-[2.5rem] font-semibold leading-tight text-white sm:text-[3rem] print:text-black">
          {s("yatra.planner.title")}
        </h1>
        <p className="mt-1 max-w-xl text-[#F3E4CC] print:hidden">
          {s("yatra.planner.heroSub")}
        </p>
        <dl className="mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3 print:hidden">
          <div className={stat}>
            <dt className="text-caption text-[#F3D9A4]">
              {s("yatra.planner.stat.days")}
            </dt>
            <dd
              className="font-display text-[1.75rem] font-bold leading-none"
              data-testid="trip-total"
            >
              <span className="sr-only">
                {s("yatra.planner.total", { count: days })}
              </span>
              <span aria-hidden="true">{days}</span>
            </dd>
          </div>
          <div className={stat}>
            <dt className="text-caption text-[#F3D9A4]">
              {s("yatra.planner.stat.places")}
            </dt>
            <dd className="font-display text-[1.75rem] font-bold leading-none">
              {items.length}
            </dd>
          </div>
          <div className={stat}>
            <dt className="text-caption text-[#F3D9A4]">
              {s("yatra.planner.stat.cost")}
            </dt>
            <dd className="mt-1 text-small font-bold leading-tight">
              {items.length ? `${rupees(group.min)}+` : "-"}
            </dd>
          </div>
        </dl>
      </header>

      {ready && saved === false ? (
        <p role="status" className="text-small text-text-muted print:hidden">
          {s("yatra.planner.notSaved")}
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-8 lg:row-start-1">
          {/* ---------- 1. Ready trips ---------- */}
          <section aria-labelledby="pl-start" className="print:hidden">
            <StepTitle
              n={1}
              id="pl-start"
              title={s("yatra.planner.step1")}
              sub={s("yatra.planner.step1Sub")}
            />
            <ul className="no-scrollbar relative -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-3">
              {starters.map((x) => {
                const first = byId.get(x.items[0]!.placeId)!;
                const name = s(`yatra.planner.starter.${x.id}`);
                return (
                  <li key={x.id} className="w-64 shrink-0 snap-start sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        update(x.items);
                        setMsg(s("yatra.planner.starterUsed", { name }));
                      }}
                      className="group relative isolate flex h-44 w-full flex-col justify-end overflow-hidden rounded-[var(--r-xl)] p-4 text-left text-white shadow-elev-1"
                    >
                      <Thumb
                        p={first}
                        className="absolute inset-0 -z-10 h-full w-full transition-transform duration-500 group-hover:scale-105"
                      />
                      <span
                        aria-hidden="true"
                        className="photo-shade absolute inset-0 -z-10"
                      />
                      <span className="font-display text-[1.375rem] font-semibold leading-tight">
                        {name}
                      </span>
                      <span className="mt-1 text-small text-[#F3E4CC]">
                        {s("yatra.itin.days", { count: totalDays(x.items) })} ·{" "}
                        {x.items
                          .map((i) => byId.get(i.placeId)!.name.text)
                          .join(" · ")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* ---------- 2. Add places ---------- */}
          <section aria-labelledby="pl-pick" className="print:hidden">
            <StepTitle n={2} id="pl-pick" title={s("yatra.planner.step2")} />
            <div className="mb-4 flex flex-col gap-3">
              <label className="relative">
                <span className="sr-only">{s("yatra.planner.search")}</span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                >
                  <PlannerIcon name="MagnifyingGlass" size={18} />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={s("yatra.planner.search")}
                  className="min-h-12 w-full rounded-full border border-border-input bg-surface pl-11 pr-4"
                />
              </label>
              <div
                role="group"
                aria-label={s("yatra.filter.tradition")}
                className="no-scrollbar relative -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
              >
                <button
                  type="button"
                  className={`${btn.chip} shrink-0`}
                  aria-pressed={trad === "all"}
                  onClick={() => setTrad("all")}
                >
                  {s("yatra.filter.allTraditions")}
                </button>
                {traditions.map((tr) => (
                  <button
                    key={tr}
                    type="button"
                    className={`${btn.chip} shrink-0`}
                    aria-pressed={trad === tr}
                    onClick={() => setTrad(tr)}
                  >
                    {t(`tradition.${tr}`)}
                  </button>
                ))}
              </div>
            </div>
            {matches.length === 0 ? (
              <p className="text-text-muted">
                {items.length === places.length
                  ? s("yatra.planner.allAdded")
                  : s("yatra.planner.noMatch")}
              </p>
            ) : (
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                {shown.map((p) => (
                  <li
                    key={p.id}
                    className="flex min-w-0 items-center gap-3 rounded-2xl border border-divider bg-surface p-2 pr-3 shadow-elev-1"
                  >
                    <Thumb p={p} className="h-16 w-16 shrink-0 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <T t={p.name} className="block truncate font-semibold" />
                      <T
                        t={p.state}
                        className="block truncate text-small text-text-muted"
                      />
                    </span>
                    <button
                      type="button"
                      disabled={full}
                      onClick={() => update(addPlace(items, p.id))}
                      aria-label={s("yatra.planner.addNamed", {
                        name: p.name.text,
                      })}
                      className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-primary-tint px-3 text-small font-semibold text-on-primary-tint hover:bg-primary hover:text-on-primary disabled:opacity-50"
                    >
                      <PlannerIcon name="Plus" size={16} />
                      {s("yatra.planner.addShort")}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!q && matches.length > PREVIEW && (
              <button
                type="button"
                className={`${btn.ghost} mt-3`}
                aria-expanded={showAll}
                onClick={() => setShowAll(!showAll)}
              >
                {showAll
                  ? s("yatra.planner.showLess")
                  : s("yatra.planner.showAll", { count: matches.length })}
              </button>
            )}
          </section>

          {/* ---------- 3. Route ---------- */}
          <section aria-labelledby="pl-trip">
            <StepTitle n={3} id="pl-trip" title={s("yatra.planner.step3")} />
            {items.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 rounded-[var(--r-xl)] border-2 border-dashed border-divider p-8 text-center"
                data-testid="trip-empty"
              >
                <PlannerIcon name="Path" size={36} className="text-primary" />
                <p className="font-semibold">{s("yatra.planner.emptyTitle")}</p>
                <p className="text-small text-text-muted">
                  {s("yatra.planner.empty")}
                </p>
              </div>
            ) : (
              <ol
                className="relative flex flex-col gap-3"
                data-testid="trip-items"
              >
                {items.map((it, idx) => {
                  const p = byId.get(it.placeId)!;
                  return (
                    <li
                      key={it.placeId}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-divider bg-surface p-3 shadow-elev-1"
                    >
                      <span className="relative shrink-0">
                        <Thumb p={p} className="h-16 w-16 rounded-xl" />
                        <span
                          aria-hidden="true"
                          className="brand-saffron absolute -left-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full text-small font-bold text-white shadow"
                        >
                          {idx + 1}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <Link
                          href={yatraRoutes.detail(locale, p.id)}
                          className="block truncate font-semibold hover:text-primary"
                          lang={p.name.lang}
                        >
                          {p.name.text}
                        </Link>
                        <T
                          t={p.state}
                          className="block truncate text-small text-text-muted"
                        />
                      </span>
                      <div
                        role="group"
                        aria-label={s("yatra.planner.daysFor", {
                          name: p.name.text,
                        })}
                        className="flex rounded-full bg-surface-2 p-1 print:hidden"
                      >
                        {DAYS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            aria-pressed={it.days === d}
                            aria-label={s("yatra.planner.daysAt", {
                              n: d,
                              name: p.name.text,
                            })}
                            onClick={() =>
                              update(setDays(items, it.placeId, d))
                            }
                            className="h-11 w-11 rounded-full font-semibold text-text-muted aria-[pressed=true]:bg-primary aria-[pressed=true]:text-on-primary"
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <span className="hidden text-small font-semibold print:inline">
                        {s("yatra.itin.days", { count: it.days })}
                      </span>
                      <span className="flex print:hidden">
                        <button
                          type="button"
                          className={btn.icon}
                          disabled={idx === 0}
                          onClick={() =>
                            update(movePlace(items, it.placeId, -1))
                          }
                          aria-label={s("yatra.planner.up", {
                            name: p.name.text,
                          })}
                        >
                          <PlannerIcon name="ArrowUp" size={18} />
                        </button>
                        <button
                          type="button"
                          className={btn.icon}
                          disabled={idx === items.length - 1}
                          onClick={() =>
                            update(movePlace(items, it.placeId, 1))
                          }
                          aria-label={s("yatra.planner.down", {
                            name: p.name.text,
                          })}
                        >
                          <PlannerIcon name="ArrowDown" size={18} />
                        </button>
                        <button
                          type="button"
                          className={`${btn.icon} text-error`}
                          onClick={() => update(removePlace(items, it.placeId))}
                          aria-label={`${s("yatra.planner.remove")} ${p.name.text}`}
                        >
                          <PlannerIcon name="Trash" size={18} />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        {/* ---------- Side panel: details and summary ---------- */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1">
          <section
            aria-labelledby="pl-set"
            className="rounded-[var(--r-xl)] border border-divider bg-surface p-5 shadow-elev-1 print:hidden"
          >
            <h2
              id="pl-set"
              className="font-display text-[1.375rem] font-semibold"
            >
              {s("yatra.planner.settings")}
            </h2>
            <label className="mt-3 flex flex-col gap-1">
              <span className="text-small text-text-muted">
                {s("yatra.planner.start")}
              </span>
              <input
                type="date"
                value={cfg.start}
                onChange={(e) => updateCfg({ start: e.target.value })}
                className="min-h-11 rounded-xl border border-border-input bg-surface px-3"
              />
            </label>
            <div className="mt-3">
              <p className="text-small text-text-muted" id="pl-trav">
                {s("yatra.planner.travellers")}
              </p>
              <div
                role="group"
                aria-labelledby="pl-trav"
                className="mt-1 flex items-center gap-3"
              >
                <button
                  type="button"
                  className={`${btn.icon} border border-border-input`}
                  disabled={cfg.travellers <= 1}
                  onClick={() => updateCfg({ travellers: cfg.travellers - 1 })}
                  aria-label={s("yatra.planner.fewer")}
                >
                  <PlannerIcon name="Minus" size={18} />
                </button>
                <output
                  aria-live="polite"
                  className="min-w-8 text-center font-display text-[1.5rem] font-bold"
                >
                  {cfg.travellers}
                </output>
                <button
                  type="button"
                  className={`${btn.icon} border border-border-input`}
                  disabled={cfg.travellers >= 20}
                  onClick={() => updateCfg({ travellers: cfg.travellers + 1 })}
                  aria-label={s("yatra.planner.more")}
                >
                  <PlannerIcon name="Plus" size={18} />
                </button>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-small text-text-muted">
                {s("yatra.planner.level")}
              </p>
              <div
                role="group"
                aria-label={s("yatra.planner.level")}
                className="mt-1 flex flex-wrap gap-2"
              >
                {BANDS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={btn.chip}
                    aria-pressed={cfg.band === b}
                    onClick={() => updateCfg({ band: b })}
                  >
                    {s(`yatra.band.${b}`)}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section
            aria-labelledby="pl-sum"
            className="brand-earth brand-glow relative isolate overflow-hidden rounded-[var(--r-xl)] p-5 text-white shadow-elev-2 print:hidden"
          >
            <h2
              id="pl-sum"
              className="flex items-center gap-2 font-display text-[1.375rem] font-semibold text-white"
            >
              <PlannerIcon name="Wallet" size={20} className="text-[#F5B22E]" />
              {s("yatra.planner.summary")}
            </h2>
            {items.length === 0 ? (
              <p className="mt-2 text-small text-[#F3E4CC]">
                {s("yatra.planner.empty")}
              </p>
            ) : (
              <>
                <p className="mt-2 text-small text-[#F3E4CC]">
                  {s("yatra.itin.days", { count: days })} ·{" "}
                  {s("yatra.planner.placesCount", { count: items.length })}
                </p>
                <p className="mt-1 font-semibold">
                  {cfg.start && endKey
                    ? s("yatra.planner.dates", {
                        from: formatDateKey(cfg.start, locale, {
                          day: "numeric",
                          month: "short",
                        }),
                        to: formatDateKey(endKey, locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }),
                      })
                    : null}
                </p>
                <p className="mt-3 font-display text-[1.5rem] font-bold leading-tight text-[#F5B22E]">
                  {s("yatra.planner.costFor", {
                    min: rupees(group.min),
                    max: rupees(group.max),
                    count: cfg.travellers,
                  })}
                </p>
                <p className="text-caption text-[#F3E4CC]">
                  {s("yatra.planner.costNote")}
                </p>

                <h3 className="mt-4 flex items-center gap-2 text-small font-semibold text-[#F3D9A4]">
                  <PlannerIcon name="Info" size={16} />
                  {s("yatra.planner.season")}
                </h3>
                {!cfg.start ? (
                  <p className="text-small text-[#F3E4CC]">
                    {s("yatra.planner.noDate")}
                  </p>
                ) : warnings.length === 0 ? (
                  <p className="flex items-center gap-1.5 text-small">
                    <PlannerIcon
                      name="Check"
                      size={16}
                      className="text-[#F5B22E]"
                    />
                    {s("yatra.planner.seasonOk")}
                  </p>
                ) : (
                  <ul
                    className="mt-1 flex flex-col gap-1 text-small"
                    data-testid="season-warnings"
                  >
                    {warnings.map((w) => (
                      <li
                        key={`${w.placeId}-${w.month}`}
                        className="rounded-lg bg-white/10 px-3 py-2"
                      >
                        {s("yatra.planner.seasonWarn", {
                          place: w.placeName,
                          month: monthName(w.month, locale),
                        })}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F5B22E] px-6 font-semibold text-[#35180A] hover:bg-[#F8C04D]"
                  >
                    <PlannerIcon name="Printer" size={18} />
                    {s("yatra.planner.print")}
                  </button>
                  <button
                    type="button"
                    className={`${darkBtn} ${canShare ? "" : "col-span-2"}`}
                    onClick={() => void copy()}
                  >
                    <PlannerIcon name="Copy" size={16} />
                    {s("yatra.planner.copy")}
                  </button>
                  {canShare && (
                    <button
                      type="button"
                      className={darkBtn}
                      onClick={() => void share()}
                    >
                      <PlannerIcon name="ShareNetwork" size={16} />
                      {s("yatra.planner.share")}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${darkBtn} col-span-2 border-transparent`}
                    onClick={() => {
                      update([]);
                      setMsg(s("yatra.planner.cleared"));
                    }}
                  >
                    <PlannerIcon name="Trash" size={16} />
                    {s("yatra.planner.clear")}
                  </button>
                </div>
              </>
            )}
          </section>
          <p role="status" className="text-small text-text-muted">
            {msg}
          </p>
          <p className="text-small text-text-muted">{s("yatra.disclaimer")}</p>
        </aside>

        {/* ---------- Day-by-day plan ---------- */}
        {plan.length > 0 && (
          <section
            aria-labelledby="pl-plan"
            data-testid="trip-plan"
            className="min-w-0 lg:col-span-8"
          >
            <h2
              id="pl-plan"
              className="mb-4 flex items-center gap-2 font-display text-[1.625rem] font-semibold"
            >
              <PlannerIcon
                name="CalendarPlus"
                size={22}
                className="text-primary"
              />
              {s("yatra.planner.plan")}
            </h2>
            <ol className="relative flex flex-col gap-4 border-l-2 border-primary-tint pl-6">
              {plan.map((d) => {
                const p = byId.get(d.placeId)!;
                const date = dateOf(d.dayNo);
                return (
                  <li
                    key={d.dayNo}
                    className="relative rounded-2xl border border-divider bg-surface p-4 shadow-elev-1"
                  >
                    <span
                      aria-hidden="true"
                      className="brand-saffron absolute -left-[2.35rem] top-4 h-4 w-4 rounded-full ring-4 ring-bg"
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <h3 className="font-display text-[1.25rem] font-semibold">
                        {s("yatra.planner.dayN", { n: d.dayNo })} ·{" "}
                        <span lang={p.name.lang}>{d.placeName}</span>
                      </h3>
                      <p className="text-small text-text-muted">
                        {date ? `${date} · ` : ""}
                        {s("yatra.planner.dayOf", {
                          k: d.placeDay,
                          of: d.ofDays,
                        })}
                      </p>
                    </div>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {d.parts.map((x, i) => (
                        <li
                          key={i}
                          className="flex gap-2.5 rounded-xl bg-surface-2 p-3"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-0.5 text-primary"
                          >
                            <Icon name={PART_ICON[x.part]} size={18} />
                          </span>
                          <span>
                            <span className="block text-caption font-semibold text-text-muted">
                              {s(`yatra.part.${x.part}`)}
                            </span>
                            <span lang={p.name.lang}>{x.text}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
