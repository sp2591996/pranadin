"use client";

import { Icon } from "@/components/Icon";
import { useS } from "@/features/shared/strings";
import { PlannerIcon } from "./PlannerIcon";
import type { PlannerIconName } from "./planner-icons.generated";
import { BUS_CLASSES, TRAIN_CLASSES, carsFor, dayTrips, legShape, totalOf, type BusClass, type Choice, type CostLine, type Mode, type Slot, type TrainClass } from "./trip-engine";
import type { Trip } from "./trip-compute";
import type { CityView, PlaceView, Txt } from "./types";

/* Detailed plan sections (D-038), loaded only once a home town is chosen. */
const MODE_ICON: Record<Mode, PlannerIconName> = { train: "Train", bus: "Bus", cab: "Car", flight: "Airplane" };
const GROUP_ICON: Record<CostLine["group"], PlannerIconName> = {
  travel: "Path",
  stay: "Bed",
  food: "ForkKnife",
  local: "Car",
  darshan: "HandsPraying",
  buffer: "PiggyBank",
};
const PART_ICON = { morning: "SunHorizon", afternoon: "Sun", evening: "SunDim", night: "SunDim" } as const;
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const T = ({ t }: { t: Txt }) => <span lang={t.lang}>{t.text}</span>;

function useNames(byId: Map<string, PlaceView>, home: CityView) {
  const s = useS();
  const name = (id: string) => (id === home.id ? home.name.text : byId.get(id)?.name.text ?? id);
  const mode = (m: string, cls: string | number = "") => {
    const base = s(`yatra.planner.mode.${m}`);
    if (m === "train" && cls) return `${base} (${s(`yatra.planner.cls.${cls}`)})`;
    if (m === "bus" && cls) return `${base} (${s(`yatra.planner.bus.${cls}`)})`;
    return base;
  };
  return { name, mode };
}

/* ------------------------- travel legs ------------------------- */

export function LegsSection({
  trip,
  byId,
  home,
  people,
  onPick,
}: {
  trip: Trip;
  byId: Map<string, PlaceView>;
  home: CityView;
  people: number;
  onPick: (key: string, patch: Partial<Choice>) => void;
}) {
  const s = useS();
  const { name } = useNames(byId, home);
  return (
    <ol className="flex flex-col gap-3" data-testid="trip-legs">
      {trip.legs.map((l, i) => {
        const label = s("yatra.planner.legFor", { from: name(l.from), to: name(l.to) });
        return (
          <li key={l.key} className="min-w-0 rounded-2xl border border-divider bg-surface p-4 shadow-elev-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span
                aria-hidden="true"
                className="brand-saffron flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-small font-bold text-white"
              >
                {i + 1}
              </span>
              <h3 className="min-w-0 font-semibold">{label}</h3>
              <span className="text-small text-text-muted">· {l.chosen.km} km</span>
            </div>
            <div role="group" aria-label={label} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {l.options.map((o) => {
                const on = o.mode === l.chosen.mode;
                return (
                  <button
                    key={o.mode}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onPick(l.key, { mode: o.mode })}
                    className={`flex min-h-11 flex-col items-start gap-0.5 rounded-xl border-2 p-2.5 text-left transition-colors ${
                      on ? "border-primary bg-primary-tint text-on-primary-tint" : "border-divider bg-surface hover:border-primary"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      <PlannerIcon name={MODE_ICON[o.mode]} size={18} />
                      {s(`yatra.planner.mode.${o.mode}`)}
                    </span>
                    <span className="text-caption">
                      {o.hours.min}–{o.hours.max} h
                    </span>
                    <span className="text-small font-bold">{rupees(o.cost.min)}+</span>
                  </button>
                );
              })}
            </div>
            {l.chosen.mode === "train" && (
              <label className="mt-3 flex flex-wrap items-center gap-2 text-small">
                <span className="text-text-muted">{s("yatra.planner.trainClass")}</span>
                <select
                  value={l.choice.train}
                  onChange={(e) => onPick(l.key, { mode: "train", train: e.target.value as TrainClass })}
                  className="min-h-11 rounded-xl border border-border-input bg-surface px-3"
                >
                  {TRAIN_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {s(`yatra.planner.cls.${c}`)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {l.chosen.mode === "bus" && (
              <label className="mt-3 flex flex-wrap items-center gap-2 text-small">
                <span className="text-text-muted">{s("yatra.planner.busType")}</span>
                <select
                  value={l.choice.bus}
                  onChange={(e) => onPick(l.key, { mode: "bus", bus: e.target.value as BusClass })}
                  className="min-h-11 rounded-xl border border-border-input bg-surface px-3"
                >
                  {BUS_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {s(`yatra.planner.bus.${c}`)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="mt-2 text-small text-text-muted">
              {s("yatra.planner.legLine", { km: l.chosen.km, hmin: l.chosen.hours.min, hmax: l.chosen.hours.max })} ·{" "}
              <strong className="text-text">
                {s("yatra.planner.groupCost", { min: rupees(l.chosen.cost.min), max: rupees(l.chosen.cost.max) })}
              </strong>
              {l.chosen.mode === "cab" ? ` · ${s("yatra.planner.cars", { count: carsFor(people) })}` : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------- day-by-day plan ------------------------- */

function SlotText({ slot, byId, home }: { slot: Slot; byId: Map<string, PlaceView>; home: CityView }) {
  const s = useS();
  const { name, mode } = useNames(byId, home);
  const v = slot.v;
  const p = typeof v.place === "string" ? byId.get(v.place) : undefined;
  const to = typeof v.to === "string" ? name(v.to) : "";
  const legVals = {
    from: typeof v.from === "string" ? name(v.from) : "",
    to,
    mode: mode(String(v.mode ?? ""), v.cls ?? ""),
    km: v.km ?? 0,
    hmin: v.hmin ?? 0,
    hmax: v.hmax ?? 0,
  };
  switch (slot.kind) {
    case "depart": {
      const shape = legShape(Number(v.hmax), v.mode as Mode);
      const key = shape === "hop" ? "hop" : shape === "day" ? "day" : "night";
      return <>{s(`yatra.planner.p.${key}`, legVals)}</>;
    }
    case "travel":
      return <>{s("yatra.planner.p.travel", { to })}</>;
    case "arrive": {
      const dest = typeof v.to === "string" ? byId.get(v.to) : undefined;
      const km = v.mode === "flight" ? dest?.reach.air.km : v.mode === "train" ? dest?.reach.rail.km : 0;
      return (
        <>
          {s("yatra.planner.p.arrive", { to })}{" "}
          {km ? s(v.mode === "flight" ? "yatra.planner.p.air" : "yatra.planner.p.rail", { km }) : null}
        </>
      );
    }
    case "home":
      return <>{s("yatra.planner.p.home", { to: home.name.text })}</>;
    case "rest":
      return <>{s("yatra.planner.p.rest")}</>;
    case "darshan": {
      if (!p) return null;
      const sight = p.sights.find((x) => x.id === v.sight)?.name.text ?? p.name.text;
      return <>{s("yatra.planner.p.darshan", { sight, hmin: v.hmin ?? 1, hmax: v.hmax ?? 2 })}</>;
    }
    case "sights": {
      if (!p) return null;
      const list = p.sights.slice(Number(v.from), Number(v.to)).map((x) => x.name.text);
      return list.length ? <>{s("yatra.planner.p.sights", { list: list.join(", ") })}</> : <>{s("yatra.planner.p.rest")}</>;
    }
    case "daytrip": {
      if (!p) return null;
      const trips = dayTrips(p);
      const list = String(v.idx)
        .split(",")
        .map((i) => trips[Number(i)])
        .filter((x) => !!x)
        .map((x) => s("yatra.planner.p.tripItem", { name: x!.name.text, km: x!.km }));
      return (
        <>
          {s("yatra.planner.p.daytrip", { list: list.join(", "), h: v.h ?? 0 })}{" "}
          {s("yatra.planner.p.dayCab", { cost: `${rupees(2800)}–${rupees(3800)}` })}
        </>
      );
    }
    case "local":
      return p ? <T t={p.localTransport} /> : null;
    default:
      return null;
  }
}

export function PlanSection({
  trip,
  byId,
  home,
  dateOf,
}: {
  trip: Trip;
  byId: Map<string, PlaceView>;
  home: CityView;
  dateOf: (n: number) => string | null;
}) {
  const s = useS();
  const { name } = useNames(byId, home);
  return (
    <ol className="relative flex flex-col gap-4 border-l-2 border-primary-tint pl-6">
      {trip.days.map((d) => {
        const p = d.placeId ? byId.get(d.placeId) : undefined;
        const date = dateOf(d.n);
        const night =
          d.night === "move" ? s("yatra.planner.dayMove", { n: d.n }).split("·").pop()!.trim() : d.night === "home" ? home.name.text : name(d.night);
        return (
          <li key={d.n} className="relative overflow-hidden rounded-2xl border border-divider bg-surface shadow-elev-1">
            <span aria-hidden="true" className="brand-saffron absolute -left-[2.35rem] top-4 h-4 w-4 rounded-full ring-4 ring-bg" />
            <div className="flex items-stretch">
              {p?.photos[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/yatra/${p.id}/${p.photos[0].file}`}
                  alt=""
                  loading="lazy"
                  className="hidden w-32 shrink-0 object-cover sm:block"
                />
              )}
              <div className="min-w-0 flex-1 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="font-display text-[1.25rem] font-semibold">
                    {p ? s("yatra.planner.dayAt", { n: d.n, place: p.name.text }) : s("yatra.planner.dayMove", { n: d.n })}
                  </h3>
                  <p className="text-small text-text-muted">{date}</p>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {d.slots.map((x, i) => (
                    <li key={i} className="flex gap-2.5 rounded-xl bg-surface-2 p-3">
                      <span aria-hidden="true" className="mt-0.5 text-primary">
                        {x.kind === "depart" || x.kind === "travel" ? (
                          <PlannerIcon name={MODE_ICON[(x.v.mode as Mode) ?? "cab"] ?? "Car"} size={18} />
                        ) : x.kind === "darshan" ? (
                          <PlannerIcon name="HandsPraying" size={18} />
                        ) : x.kind === "daytrip" ? (
                          <PlannerIcon name="Mountains" size={18} />
                        ) : (
                          <Icon name={PART_ICON[x.part]} size={18} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-caption font-semibold text-text-muted">{s(`yatra.part.${x.part}`)}</span>
                        <SlotText slot={x} byId={byId} home={home} />
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex items-center gap-1.5 text-caption text-text-muted">
                  <PlannerIcon name={d.night === "move" ? "Train" : d.night === "home" ? "House" : "Bed"} size={14} />
                  {s("yatra.planner.part.night")}: {night}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------- cost breakdown ------------------------- */

export function CostSection({
  trip,
  byId,
  home,
  people,
}: {
  trip: Trip;
  byId: Map<string, PlaceView>;
  home: CityView;
  people: number;
}) {
  const s = useS();
  const { name, mode } = useNames(byId, home);
  const groups = (Object.keys(GROUP_ICON) as CostLine["group"][]).map((g) => {
    const lines = trip.lines.filter((l) => l.group === g);
    return { g, lines, sum: totalOf(lines) };
  });
  const label = (l: CostLine) => {
    const v = l.v;
    switch (l.group) {
      case "travel":
        return s("yatra.planner.c.leg", { from: name(String(v.from)), to: name(String(v.to)), mode: mode(String(v.mode), v.cls ?? "") });
      case "stay":
        return s("yatra.planner.c.stay", { place: name(String(v.place)), nights: v.nights ?? 0, rooms: v.rooms ?? 1 });
      case "food":
        return s("yatra.planner.c.food", { days: v.days ?? 0, people: v.people ?? people });
      case "local":
        return s("yatra.planner.c.local", { place: name(String(v.place)), trips: v.trips ?? 0 });
      case "darshan":
        return s("yatra.planner.c.darshan");
      default:
        return s("yatra.planner.c.buffer");
    }
  };
  const t = trip.total;
  return (
    <div className="flex flex-col gap-3" data-testid="trip-costs">
      {groups
        .filter((x) => x.lines.length)
        .map(({ g, lines, sum }) => (
          <section key={g} aria-label={s(`yatra.planner.cg.${g}`)} className="rounded-2xl border border-divider bg-surface p-4 shadow-elev-1">
            <h3 className="flex items-center justify-between gap-3 font-semibold">
              <span className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-on-primary-tint">
                  <PlannerIcon name={GROUP_ICON[g]} size={18} />
                </span>
                {s(`yatra.planner.cg.${g}`)}
              </span>
              <span className="text-right">
                {rupees(sum.min)}–{rupees(sum.max)}
              </span>
            </h3>
            <ul className="mt-2 flex flex-col divide-y divide-divider text-small">
              {lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 text-text-muted">{label(l)}</span>
                  <span className="shrink-0 font-semibold">
                    {rupees(l.cost.min)}–{rupees(l.cost.max)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      <div className="brand-earth brand-glow relative isolate overflow-hidden rounded-2xl p-5 text-white shadow-elev-2">
        <p className="text-small text-[#F3D9A4]">{s("yatra.planner.total2")}</p>
        <p className="font-display text-[1.75rem] font-bold leading-tight text-[#F5B22E]" data-testid="trip-cost-total">
          {rupees(t.min)}–{rupees(t.max)}
        </p>
        <p className="text-small text-[#F3E4CC]">
          {s("yatra.planner.perHead", { min: rupees(Math.round(t.min / people)), max: rupees(Math.round(t.max / people)) })}
        </p>
      </div>
      <p className="text-caption text-text-muted">{s("yatra.planner.fareNote")}</p>
    </div>
  );
}

