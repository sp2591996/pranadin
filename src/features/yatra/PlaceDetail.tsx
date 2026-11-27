"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { Mandala } from "@/components/Mandala";
import { useI18n } from "@/i18n/client";
import { formatDateKey } from "@/i18n/format";
import { useS } from "@/features/shared/strings";
import { festivalRoutes } from "@/features/festivals/routes";
import { addPlace } from "./plan-logic";
import { yatraRoutes } from "./routes";
import { loadTrip, saveTrip } from "./store";
import { TravelIcon } from "./TravelIcon";
import type { TravelIconName } from "./travel-icons.generated";
import { monthName } from "./month";
import type { BudgetBand, DayPart, PlaceView, Txt } from "./types";

const TABS = ["overview", "reach", "sights", "itineraries", "stay", "know"] as const;
type Tab = (typeof TABS)[number];
const BANDS: BudgetBand[] = ["budget", "mid", "comfort"];
const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const PART_ICON: Record<DayPart, "Sun" | "SunDim" | "SunHorizon"> = { morning: "SunHorizon", afternoon: "Sun", evening: "SunDim" };
/** Month cell colour by rating (brand palette, D-037). */
const RATING_CELL = { best: "bg-primary text-on-primary", good: "bg-[#F4CB86] text-[#3A1A0B]", difficult: "bg-surface-2 text-text-muted" } as const;

const T = ({ t, className = "" }: { t: Txt; className?: string }) => (
  <span lang={t.lang} className={className}>
    {t.text}
  </span>
);

function SectionTitle({ icon, children }: { icon: TravelIconName | null; children: React.ReactNode }) {
  return (
    <h3 className="mb-3 mt-8 flex items-center gap-2.5 font-display text-[1.5rem] font-semibold leading-tight first:mt-0">
      {icon && (
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
          <TravelIcon name={icon} size={18} />
        </span>
      )}
      {children}
    </h3>
  );
}

function Checklist({ items }: { items: Txt[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
            <TravelIcon name="Check" size={14} />
          </span>
          <T t={x} />
        </li>
      ))}
    </ul>
  );
}

/** Photo hero with name over the image; real photos show their credit, AI images their label (D-032, D-037). */
function Hero({ p }: { p: PlaceView }) {
  const s = useS();
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const ph = p.photos[Math.min(i, p.photos.length - 1)];
  const title = (
    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
      <p className="flex flex-wrap gap-2">
        {p.traditions.map((tr) => (
          <span key={tr} className="glass rounded-full px-3 py-1 text-caption font-semibold text-white">
            {t(`tradition.${tr}`)}
          </span>
        ))}
      </p>
      <h1 lang={p.name.lang} className="mt-2 text-[2.5rem] font-semibold leading-[1.05] text-white sm:text-[3.5rem]">
        {p.name.text}
      </h1>
      <p className="mt-1 flex items-center gap-1.5 text-[#F3E4CC]">
        <Icon name="MapPin" size={16} />
        <T t={p.state} />
      </p>
      <p className="mt-1 max-w-2xl font-display text-[1.25rem] italic text-[#F5C766]">
        <T t={p.tagline} />
      </p>
    </div>
  );
  if (!ph) {
    return (
      <header className="brand-earth relative isolate -mx-4 min-h-[22rem] overflow-hidden sm:mx-0 sm:rounded-[var(--r-xl)]">
        <Mandala className="slow-spin absolute -right-16 -top-16 -z-10 h-[320px] w-[320px] text-[#F3C35B] opacity-20" />
        <p className="glass absolute left-5 top-5 rounded-full px-3 py-1 text-small text-white">{s("yatra.noPhoto")}</p>
        {title}
      </header>
    );
  }
  return (
    <div className="flex flex-col gap-2" data-testid="gallery">
      <header className="relative isolate -mx-4 overflow-hidden bg-[#2A1408] sm:mx-0 sm:rounded-[var(--r-xl)]">
        {/* Static export with unoptimised images: a plain img keeps the file we ship. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/yatra/${p.id}/${ph.file}`}
          alt={ph.caption.text}
          lang={ph.caption.lang}
          width={1600}
          height={1067}
          loading="eager"
          fetchPriority="high"
          className="aspect-[4/3] w-full object-cover sm:aspect-[16/9] lg:aspect-[21/9]"
        />
        <span aria-hidden="true" className="photo-shade absolute inset-0" />
        {title}
        {p.photos.length > 1 && (
          <div role="group" aria-label={s("yatra.gallery")} className="absolute right-4 top-4 flex gap-2">
            {p.photos.map((x, k) => (
              <button
                key={x.file}
                type="button"
                aria-pressed={k === i}
                onClick={() => setI(k)}
                className="relative h-12 w-16 overflow-hidden rounded-xl border-2 border-white/40 shadow-md aria-[pressed=true]:border-[#F5B22E]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/yatra/${p.id}/${x.file}`} alt="" className="h-full w-full object-cover" />
                <span className="sr-only">{s("yatra.photoN", { n: k + 1 })}</span>
              </button>
            ))}
          </div>
        )}
      </header>
      <p className="text-small text-text-muted">
        <T t={ph.caption} />
        {" · "}
        {ph.ai ? (
          <span data-testid="ai-caption">{s("yatra.aiImage")}</span>
        ) : (
          <span data-testid="photo-credit">
            {s("yatra.photoCredit", { credit: "" })}
            {ph.source ? (
              <a href={ph.source} target="_blank" rel="noopener noreferrer" lang="en" className="underline underline-offset-2 hover:text-primary">
                {ph.credit}
              </a>
            ) : (
              <span lang="en">{ph.credit}</span>
            )}
          </span>
        )}
      </p>
    </div>
  );
}

/** One place, picture-first (D-037): hero photo, at-a-glance graphics, a plan panel and short icon-led sections. Information only. */
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
  const itin = p.itineraries.find((i) => i.days === day) ?? p.itineraries[0]!;
  const dayOptions = p.itineraries.map((i) => i.days);
  const rating = (m: number) => p.seasons.find((x) => x.months.includes(m))?.rating ?? (p.bestMonths.includes(m) ? "best" : "difficult");
  const short = (m: number) => formatDateKey(`2027-${String(m).padStart(2, "0")}-01`, locale, { month: "short" });
  const maxBudget = Math.max(...BANDS.map((b) => p.budget.bands[b].max));
  const mid = p.budget.bands.mid;

  return (
    <article className="wide flex flex-col gap-6">
      <Link href={yatraRoutes.list(locale)} className="inline-flex min-h-11 items-center gap-1.5 self-start text-small font-semibold text-primary hover:underline">
        <Icon name="ArrowLeft" size={16} />
        {s("yatra.back")}
      </Link>

      <Hero p={p} />

      {/* ---------- At a glance ---------- */}
      <section aria-labelledby="glance-h" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <h2 id="glance-h" className="sr-only">
          {s("yatra.glance.title")}
        </h2>
        <div className="col-span-2 rounded-[var(--r-xl)] border border-divider bg-surface p-4 shadow-elev-1">
          <p className="flex items-center gap-1.5 text-small font-semibold text-text">
            <Icon name="CalendarHeart" size={16} className="text-primary" />
            {s("yatra.glance.months")}
          </p>
          <ol className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-12 lg:grid-cols-6">
            {Array.from({ length: 12 }, (_, k) => k + 1).map((m) => (
              <li key={m} className={`flex min-h-9 flex-col items-center justify-center rounded-lg text-caption font-semibold ${RATING_CELL[rating(m)]}`}>
                <span aria-hidden="true">{short(m)}</span>
                <span className="sr-only">
                  {monthName(m, locale)}: {s(`yatra.rating.${rating(m)}`)}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-caption text-text-muted">
            {(["best", "good", "difficult"] as const).map((r) => (
              <span key={r} className="inline-flex items-center gap-1">
                <span aria-hidden="true" className={`h-3 w-3 rounded-sm ${RATING_CELL[r]}`} />
                {s(`yatra.rating.${r}`)}
              </span>
            ))}
          </p>
        </div>
        {(
          [
            ["Airplane", "yatra.glance.air", p.reach.air] as const,
            ["Train", "yatra.glance.rail", p.reach.rail] as const,
          ] as const
        ).map(([icon, label, g]) => (
          <div key={label} className="rounded-[var(--r-xl)] border border-divider bg-surface p-4 shadow-elev-1">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-tint text-primary">
              <TravelIcon name={icon} size={20} />
            </span>
            <p className="mt-2 text-caption text-text-muted">{s(label)}</p>
            <p className="font-display text-[1.75rem] font-semibold leading-none">{s("yatra.kmShort", { km: g.km })}</p>
            <p className="mt-1 text-small leading-snug">
              <T t={g.nearest} />
            </p>
          </div>
        ))}
        <div className="brand-gold col-span-2 rounded-[var(--r-xl)] p-4 shadow-elev-1 lg:col-span-1">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff]/60">
            <TravelIcon name="Wallet" size={20} />
          </span>
          <p className="mt-2 text-caption">{s("yatra.glance.budget")}</p>
          <p className="font-display text-[1.5rem] font-semibold leading-tight">
            {rupees(mid.min)}–{rupees(mid.max)}
          </p>
          <p className="text-caption">{s("yatra.indicative")}</p>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        {/* ---------- Plan panel (sidebar on desktop, above the sections on phones) ---------- */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:order-2 lg:col-span-4">
          <section aria-labelledby="plan-h" className="brand-earth brand-glow relative isolate overflow-hidden rounded-[var(--r-xl)] p-6 text-white shadow-elev-2">
            <h2 id="plan-h" className="flex items-center gap-2 font-display text-[1.625rem] font-semibold leading-tight text-white">
              <TravelIcon name="MapTrifold" size={22} className="text-[#F5B22E]" />
              {s("yatra.plan.title")}
            </h2>
            <p className="mt-1 text-small text-[#F3E4CC]">{s("yatra.plan.sub")}</p>
            <p className="mt-4 text-caption font-semibold text-[#F3D9A4]">{s("yatra.itin.pick")}</p>
            <div role="group" aria-label={s("yatra.itin.pick")} className="mt-2 flex flex-wrap gap-2">
              {dayOptions.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={day === d}
                  onClick={() => setDay(d)}
                  className="min-h-11 rounded-full border border-white/30 px-4 text-small font-semibold text-white transition-colors hover:bg-white/10 aria-[pressed=true]:border-[#F5B22E] aria-[pressed=true]:bg-[#F5B22E] aria-[pressed=true]:text-[#35180A]"
                >
                  {s("yatra.itin.days", { count: d })}
                </button>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void addToTrip()}
                disabled={inTrip}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F5B22E] px-6 font-semibold text-[#35180A] shadow-lg transition-colors hover:bg-[#F8C04D] disabled:bg-[#fff]/15 disabled:text-white"
              >
                <TravelIcon name={inTrip ? "Check" : "CalendarPlus"} size={18} />
                {inTrip ? s("yatra.planner.added") : s("yatra.planner.add")}
              </button>
              <Link href={yatraRoutes.planner(locale)} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-white/30 px-6 text-small font-semibold text-white hover:bg-white/10">
                {s("yatra.planner.open")}
                <Icon name="ArrowRight" size={16} />
              </Link>
            </div>
          </section>

          {p.nearby.length > 0 && (
            <section aria-labelledby="near-h" className="rounded-[var(--r-xl)] border border-divider bg-surface p-5 shadow-elev-1">
              <h2 id="near-h" className="font-display text-[1.375rem] font-semibold">
                {s("yatra.nearby")}
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {p.nearby.map((n, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-tint text-on-primary-tint">
                      <span className="text-small font-bold leading-none">{n.km}</span>
                      <span className="text-caption leading-tight">{s("yatra.kmShort", { km: "" }).trim()}</span>
                    </span>
                    <span className="min-w-0">
                      <T t={n.name} className="block font-semibold leading-snug" />
                      <T t={n.note} className="line-clamp-2 text-small text-text-muted" />
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        {/* ---------- Sections ---------- */}
        <div className="min-w-0 lg:order-1 lg:col-span-8">
          <div role="tablist" aria-label={s("yatra.tabs")} className="no-scrollbar relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {TABS.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                id={`yt-${k}`}
                aria-selected={tab === k}
                aria-controls={`yp-${k}`}
                onClick={() => setTab(k)}
                className="min-h-11 shrink-0 rounded-full border border-divider bg-surface px-4 text-small font-semibold text-text transition-colors hover:border-primary aria-[selected=true]:border-transparent aria-[selected=true]:bg-primary aria-[selected=true]:text-on-primary"
              >
                {s(`yatra.tab.${k}`)}
              </button>
            ))}
          </div>

          <section role="tabpanel" id={`yp-${tab}`} aria-labelledby={`yt-${tab}`} className="mt-4 rounded-[var(--r-xl)] border border-divider bg-surface p-5 shadow-elev-1 sm:p-7">
            {tab === "overview" && (
              <>
                <div className="flex items-start gap-3 rounded-2xl bg-primary-tint/60 p-4">
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                    <TravelIcon name="HandsPraying" size={22} />
                  </span>
                  <span>
                    <span className="block text-caption font-semibold text-on-primary-tint">{s("yatra.deity")}</span>
                    <T t={p.deity} className="font-semibold" />
                  </span>
                </div>
                <blockquote className="mt-5 border-s-4 border-primary ps-4 font-display text-[1.375rem] leading-snug text-text">
                  <T t={p.significance} />
                </blockquote>
                <p className="mt-4 text-text-muted">
                  <T t={p.overview} />
                </p>
                <details className="group mt-4 rounded-2xl border border-divider p-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between font-semibold text-primary [&::-webkit-details-marker]:hidden">
                    {s("yatra.readStory")}
                    <Icon name="CaretDown" size={18} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-2">
                    <T t={p.story} />
                  </p>
                  <p className="mt-2 text-small text-text-muted">
                    <T t={p.storySource} />
                  </p>
                </details>
                {p.festivals.length > 0 && (
                  <>
                    <SectionTitle icon={null}>{s("yatra.festivals")}</SectionTitle>
                    <ul className="flex flex-wrap gap-2">
                      {p.festivals.map((f) => (
                        <li key={f.festivalId}>
                          <Link href={festivalRoutes.detail(locale, f.festivalId)} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-divider bg-bg px-4 text-small font-semibold text-text hover:border-primary">
                            <Icon name="Flame" size={16} className="text-primary" />
                            <T t={f.name} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}

            {tab === "reach" && (
              <>
                <SectionTitle icon={null}>{s("yatra.bestTime")}</SectionTitle>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {p.seasons.map((x, i) => (
                    <li key={i} className="rounded-2xl border border-divider bg-bg p-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-caption font-semibold ${RATING_CELL[x.rating]}`}>{s(`yatra.rating.${x.rating}`)}</span>
                      <p className="mt-2 font-semibold leading-snug">{x.months.map((m) => monthName(m, locale)).join(", ")}</p>
                      <T t={x.weather} className="mt-1 block text-small text-text-muted" />
                    </li>
                  ))}
                </ul>
                <SectionTitle icon={null}>{s("yatra.reach")}</SectionTitle>
                <ul className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["Airplane", "yatra.air", p.reach.air.how, p.reach.air.km] as const,
                      ["Train", "yatra.rail", p.reach.rail.how, p.reach.rail.km] as const,
                      ["Car", "yatra.road", p.reach.road.how, p.reach.road.km] as const,
                    ] as const
                  ).map(([icon, label, how, km]) => (
                    <li key={label} className="rounded-2xl border border-divider bg-bg p-4">
                      <span className="flex items-center justify-between gap-2">
                        <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-tint text-primary">
                          <TravelIcon name={icon} size={20} />
                        </span>
                        <span className="font-display text-[1.375rem] font-semibold">{s("yatra.kmShort", { km })}</span>
                      </span>
                      <h4 className="mt-2 font-semibold">{s(label)}</h4>
                      <T t={how} className="block text-small text-text-muted" />
                    </li>
                  ))}
                </ul>
                <SectionTitle icon="Path">{s("yatra.localTransport")}</SectionTitle>
                <p>
                  <T t={p.localTransport} />
                </p>
              </>
            )}

            {tab === "sights" && (
              <>
                <SectionTitle icon={null}>{s("yatra.sights")}</SectionTitle>
                <ol className="grid gap-3 sm:grid-cols-2">
                  {p.sights.map((x, k) => (
                    <li key={x.id} className="card-lift flex flex-col gap-2 rounded-2xl border border-divider bg-bg p-4">
                      <span className="flex items-center gap-3">
                        <span aria-hidden="true" className="brand-saffron flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[1.125rem] font-bold text-white">
                          {k + 1}
                        </span>
                        <h4 className="font-semibold leading-snug" lang={x.name.lang}>
                          {x.name.text}
                        </h4>
                      </span>
                      <T t={x.desc} className="text-small text-text-muted" />
                      <span className="mt-auto flex flex-wrap gap-1.5 pt-1 text-caption">
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1">
                          <Icon name="Clock" size={14} />
                          <span className="sr-only">{s("yatra.timings")}: </span>
                          <T t={x.timings} />
                        </span>
                        <span className="rounded-full bg-primary-tint px-2.5 py-1 font-semibold text-on-primary-tint">{s("yatra.checkLocally")}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1">
                          <TravelIcon name="TShirt" size={14} />
                          <span className="sr-only">{s("yatra.dress")}: </span>
                          <T t={x.dress} />
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
                <SectionTitle icon="HandsPraying">{s("yatra.darshan")}</SectionTitle>
                <Checklist items={p.darshan.tips} />
                <p className="mt-3 text-small text-text-muted">
                  <T t={p.darshan.online} />
                </p>
              </>
            )}

            {tab === "itineraries" && (
              <>
                <h3 className="font-display text-[1.5rem] font-semibold leading-tight" lang={itin.title.lang}>
                  {itin.title.text}
                </h3>
                <p className="text-small text-text-muted">{s("yatra.itin.days", { count: itin.days })}</p>
                <ol className="mt-5 flex flex-col gap-6">
                  {itin.plan.map((d, k) => (
                    <li key={k}>
                      <h4 className="inline-flex items-center rounded-full bg-primary px-3.5 py-1 text-small font-semibold text-on-primary">{s("yatra.itin.dayN", { n: k + 1 })}</h4>
                      <ul className="mt-3 flex flex-col border-s-2 border-dashed border-[color-mix(in_srgb,var(--primary)_35%,var(--divider))] ps-5">
                        {d.map((x, j) => (
                          <li key={j} className="relative pb-4 last:pb-0">
                            <span aria-hidden="true" className="absolute -start-[2.15rem] top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-[#F5B22E] text-[#35180A]">
                              <Icon name={PART_ICON[x.part]} size={14} />
                            </span>
                            <span className="block text-caption font-semibold text-primary">{s(`yatra.part.${x.part}`)}</span>
                            <T t={x.text} />
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {tab === "stay" && (
              <>
                <SectionTitle icon="Bed">{s("yatra.stay")}</SectionTitle>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {p.stay.map((x, i) => (
                    <li key={i} className="rounded-2xl border border-divider bg-bg p-4">
                      <T t={x.title} className="block font-semibold" />
                      <T t={x.body} className="block text-small text-text-muted" />
                    </li>
                  ))}
                </ul>
                <SectionTitle icon="ForkKnife">{s("yatra.food")}</SectionTitle>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {p.food.map((x, i) => (
                    <li key={i} className="rounded-2xl border border-divider bg-bg p-4">
                      <T t={x.title} className="block font-semibold" />
                      <T t={x.body} className="block text-small text-text-muted" />
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-start gap-3 rounded-2xl bg-primary-tint/60 p-4">
                  <Icon name="FlowerLotus" size={22} className="shrink-0 text-primary" />
                  <span>
                    <span className="block font-semibold">{s("yatra.satvik")}</span>
                    <T t={p.satvik} className="text-small" />
                  </span>
                </div>
                <SectionTitle icon="Wallet">{s("yatra.budget")}</SectionTitle>
                <ul className="flex flex-col gap-3">
                  {BANDS.map((b) => {
                    const r = p.budget.bands[b];
                    return (
                      <li key={b}>
                        <span className="flex flex-wrap justify-between gap-x-3 text-small">
                          <span className="font-semibold">{s(`yatra.band.${b}`)}</span>
                          <span>{s("yatra.perDay", { min: rupees(r.min), max: rupees(r.max) })}</span>
                        </span>
                        <span aria-hidden="true" className="mt-1 block h-3 overflow-hidden rounded-full bg-surface-2">
                          <span className="block h-full rounded-full bg-gradient-to-r from-[#F5B22E] to-primary" style={{ width: `${Math.max(12, (r.max / maxBudget) * 100)}%` }} />
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-small font-semibold">{s("yatra.indicative")}</p>
                <p className="text-small text-text-muted">
                  <T t={p.budget.note} />
                </p>
              </>
            )}

            {tab === "know" && (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <SectionTitle icon="FirstAid">{s("yatra.health")}</SectionTitle>
                    <Checklist items={p.health} />
                    <p className="mt-3 text-small text-text-muted">{s("yatra.healthNote")}</p>
                  </div>
                  <div>
                    <SectionTitle icon="HandsPraying">{s("yatra.etiquette")}</SectionTitle>
                    <Checklist items={p.etiquette} />
                  </div>
                </div>
                <details className="mt-6 rounded-2xl border border-divider p-4">
                  <summary className="flex min-h-11 cursor-pointer items-center font-semibold">{s("yatra.sources")}</summary>
                  <ul className="flex flex-col text-small">
                    {p.sources.map((src) => (
                      <li key={src.url}>
                        <a href={src.url} target="_blank" rel="noopener noreferrer" lang="en" className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
                          {src.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            )}
          </section>
          <p className="mt-4 text-small text-text-muted">{s("yatra.disclaimer")}</p>
        </div>
      </div>
    </article>
  );
}
