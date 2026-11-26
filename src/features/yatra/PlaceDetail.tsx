"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mandala } from "@/components/Mandala";
import { useI18n } from "@/i18n/client";
import { useS } from "@/features/shared/strings";
import { btn, card } from "@/features/shared/ui";
import { festivalRoutes } from "@/features/festivals/routes";
import { Gallery } from "./Gallery";
import { addPlace } from "./plan-logic";
import { yatraRoutes } from "./routes";
import { loadTrip, saveTrip } from "./store";
import { monthName } from "./YatraList";
import type { BudgetBand, PlaceView, Txt } from "./types";

const TABS = ["overview", "reach", "sights", "itineraries", "stay", "know"] as const;
type Tab = (typeof TABS)[number];
const BANDS: BudgetBand[] = ["budget", "mid", "comfort"];
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const P = ({ t, className = "" }: { t: Txt; className?: string }) => (
  <p lang={t.lang} className={className}>
    {t.text}
  </p>
);
function H({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 mt-4 text-h3 first:mt-0">{children}</h3>;
}
function List({ items }: { items: Txt[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 ps-5">
      {items.map((x, i) => (
        <li key={i} lang={x.lang}>
          {x.text}
        </li>
      ))}
    </ul>
  );
}

/** One place: photo gallery, tabbed sections and itineraries. Information only; no bookings. */
export function PlaceDetail({ place: p, allIds }: { place: PlaceView; allIds: string[] }) {
  const s = useS();
  const { locale } = useI18n();
  const [tab, setTab] = useState<Tab>("overview");
  const [inTrip, setInTrip] = useState(false);
  const [day, setDay] = useState<1 | 2 | 3>(1);
  useEffect(() => {
    void loadTrip(allIds).then((r) => setInTrip(r.items.some((i) => i.placeId === p.id)));
  }, [p.id, allIds]);
  const addToTrip = async () => {
    const r = await loadTrip(allIds);
    await saveTrip(addPlace(r.items, p.id, day));
    setInTrip(true);
  };
  const itin = p.itineraries.find((i) => i.days === day)!;
  const partLabel = (k: string) => s(`yatra.part.${k}`);

  return (
    <article className="flex flex-col gap-5">
      <Link href={yatraRoutes.list(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
        {s("yatra.back")}
      </Link>
      <header className="relative isolate overflow-hidden rounded-2xl border border-divider shadow-elev-1 bg-[var(--card-hero-bg)] p-4">
        <Mandala className="absolute -right-12 -top-12 -z-10 h-48 w-48 text-[var(--accent)] opacity-40" />
        <h1 lang={p.name.lang}>{p.name.text}</h1>
        <p className="text-text-muted" lang={p.state.lang}>
          {p.state.text}
        </p>
        <P t={p.tagline} className="text-text-muted" />
      </header>

      <Gallery placeId={p.id} photos={p.photos} />

      <div role="tablist" aria-label={s("yatra.tabs")} className="flex flex-wrap gap-2">
        {TABS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`yt-${k}`}
            aria-selected={tab === k}
            aria-controls={`yp-${k}`}
            onClick={() => setTab(k)}
            className={btn.chip + " aria-[selected=true]:border-primary aria-[selected=true]:bg-primary-tint aria-[selected=true]:text-on-primary-tint"}
          >
            {s(`yatra.tab.${k}`)}
          </button>
        ))}
      </div>

      <section role="tabpanel" id={`yp-${tab}`} aria-labelledby={`yt-${tab}`} className={card}>
        {tab === "overview" && (
          <>
            <H>{s("yatra.deity")}</H>
            <P t={p.deity} />
            <H>{s("yatra.significance")}</H>
            <P t={p.significance} />
            <H>{s("yatra.overview")}</H>
            <P t={p.overview} />
            <H>{s("yatra.story")}</H>
            <P t={p.story} />
            <P t={p.storySource} className="mt-2 text-small text-text-muted" />
            {p.festivals.length > 0 && (
              <>
                <H>{s("yatra.festivals")}</H>
                <ul className="flex flex-col gap-2">
                  {p.festivals.map((f) => (
                    <li key={f.festivalId}>
                      <Link href={festivalRoutes.detail(locale, f.festivalId)} lang={f.name.lang} className="font-semibold text-primary underline underline-offset-2">
                        {f.name.text}
                      </Link>
                      <P t={f.note} className="text-small" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
        {tab === "reach" && (
          <>
            <H>{s("yatra.bestTime")}</H>
            <ul className="flex flex-col gap-2">
              {p.seasons.map((x, i) => (
                <li key={i}>
                  <span className="font-semibold">{x.months.map((m) => monthName(m, locale)).join(", ")}</span> <span className="text-small text-text-muted">({s(`yatra.rating.${x.rating}`)})</span>
                  <P t={x.weather} />
                </li>
              ))}
            </ul>
            <H>{s("yatra.reach")}</H>
            <h4 className="mt-2 font-semibold">{s("yatra.air")}</h4>
            <p lang={p.reach.air.nearest.lang}>{s("yatra.nearestKm", { name: p.reach.air.nearest.text, km: p.reach.air.km })}</p>
            <P t={p.reach.air.how} />
            <h4 className="mt-2 font-semibold">{s("yatra.rail")}</h4>
            <p lang={p.reach.rail.nearest.lang}>{s("yatra.nearestKm", { name: p.reach.rail.nearest.text, km: p.reach.rail.km })}</p>
            <P t={p.reach.rail.how} />
            <h4 className="mt-2 font-semibold">{s("yatra.road")}</h4>
            <P t={p.reach.road.how} />
            <H>{s("yatra.localTransport")}</H>
            <P t={p.localTransport} />
          </>
        )}
        {tab === "sights" && (
          <>
            <H>{s("yatra.sights")}</H>
            <ul className="flex flex-col gap-4">
              {p.sights.map((x) => (
                <li key={x.id} className="border-b border-divider pb-3 last:border-0">
                  <h4 className="font-semibold" lang={x.name.lang}>
                    {x.name.text}
                  </h4>
                  <P t={x.desc} />
                  <p className="mt-1 text-small">
                    <span className="font-semibold">{s("yatra.timings")}: </span>
                    <span lang={x.timings.lang}>{x.timings.text}</span> <span className="rounded-full bg-primary-tint px-2 text-caption text-on-primary-tint">{s("yatra.checkLocally")}</span>
                  </p>
                  <p className="text-small">
                    <span className="font-semibold">{s("yatra.dress")}: </span>
                    <span lang={x.dress.lang}>{x.dress.text}</span>
                  </p>
                </li>
              ))}
            </ul>
            <H>{s("yatra.darshan")}</H>
            <List items={p.darshan.tips} />
            <P t={p.darshan.online} className="mt-2 text-small text-text-muted" />
          </>
        )}
        {tab === "itineraries" && (
          <>
            <div role="group" aria-label={s("yatra.itin.pick")} className="mb-3 flex flex-wrap gap-2">
              {([1, 2, 3] as const).map((d) => (
                <button key={d} type="button" className={btn.chip} aria-pressed={day === d} onClick={() => setDay(d)}>
                  {s("yatra.itin.days", { count: d })}
                </button>
              ))}
            </div>
            <h3 className="text-h3" lang={itin.title.lang}>
              {itin.title.text}
            </h3>
            <ol className="mt-2 flex flex-col gap-4">
              {itin.plan.map((d, k) => (
                <li key={k}>
                  <h4 className="font-semibold">{s("yatra.itin.dayN", { n: k + 1 })}</h4>
                  <ul className="mt-1 flex flex-col gap-1">
                    {d.map((x, j) => (
                      <li key={j}>
                        <span className="font-semibold">{partLabel(x.part)}: </span>
                        <span lang={x.text.lang}>{x.text.text}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" className={btn.primary} onClick={() => void addToTrip()} disabled={inTrip}>
                {inTrip ? s("yatra.planner.added") : s("yatra.planner.add")}
              </button>
              <Link href={yatraRoutes.planner(locale)} className={btn.ghost}>
                {s("yatra.planner.open")}
              </Link>
            </div>
          </>
        )}
        {tab === "stay" && (
          <>
            <H>{s("yatra.stay")}</H>
            <ul className="flex flex-col gap-2">
              {p.stay.map((x, i) => (
                <li key={i}>
                  <span className="font-semibold" lang={x.title.lang}>
                    {x.title.text}
                  </span>
                  <P t={x.body} />
                </li>
              ))}
            </ul>
            <H>{s("yatra.food")}</H>
            <ul className="flex flex-col gap-2">
              {p.food.map((x, i) => (
                <li key={i}>
                  <span className="font-semibold" lang={x.title.lang}>
                    {x.title.text}
                  </span>
                  <P t={x.body} />
                </li>
              ))}
            </ul>
            <H>{s("yatra.satvik")}</H>
            <P t={p.satvik} />
            <H>{s("yatra.budget")}</H>
            <ul className="flex flex-col gap-1">
              {BANDS.map((b) => (
                <li key={b}>
                  <span className="font-semibold">{s(`yatra.band.${b}`)}: </span>
                  {s("yatra.perDay", { min: rupees(p.budget.bands[b].min), max: rupees(p.budget.bands[b].max) })}
                </li>
              ))}
            </ul>
            <p className="mt-1 text-small font-semibold">{s("yatra.indicative")}</p>
            <P t={p.budget.note} className="text-small text-text-muted" />
          </>
        )}
        {tab === "know" && (
          <>
            <H>{s("yatra.health")}</H>
            <List items={p.health} />
            <p className="mt-2 text-small text-text-muted">{s("yatra.healthNote")}</p>
            <H>{s("yatra.etiquette")}</H>
            <List items={p.etiquette} />
            <H>{s("yatra.nearby")}</H>
            <ul className="flex flex-col gap-2">
              {p.nearby.map((n, i) => (
                <li key={i}>
                  <span className="font-semibold" lang={n.name.lang}>
                    {n.name.text}
                  </span>{" "}
                  <span className="text-small text-text-muted">{s("yatra.km", { km: n.km })}</span>
                  <P t={n.note} />
                </li>
              ))}
            </ul>
            <H>{s("yatra.sources")}</H>
            <ul className="flex flex-col gap-1 text-small">
              {p.sources.map((src) => (
                <li key={src.url}>
                  <a href={src.url} target="_blank" rel="noopener noreferrer" lang="en" className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
                    {src.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <p className="text-small text-text-muted">{s("yatra.disclaimer")}</p>
    </article>
  );
}
