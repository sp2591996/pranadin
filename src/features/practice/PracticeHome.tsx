"use client";

/** Practice tab (E-08): streak, the 4 breath techniques and the meditation timer. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/icons.generated";
import { useI18n } from "@/i18n/client";
import { todayKey } from "@/features/shared/device";
import { useS } from "@/features/shared/strings";
import { EnglishMark } from "@/components/ObservanceBody";
import type { Locale } from "@/i18n/config";
import { ProgressCard } from "./ProgressCard";
import { loadProgress } from "./store";
import type { Progress } from "./streak";
import { practiceRoutes, SILENT_ID } from "./routes";
import { yogaRoutes } from "@/features/yoga/routes";
import { SectionHeader } from "@/components/SectionHeader";

export interface TechniqueSummary {
  slug: string;
  name: string;
  subtitle: string;
  rhythm: string;
  /** Seconds in one breath (in + out), for the orb's pace. */
  cycle?: number;
  lang: Locale;
}
export interface MeditationSummary {
  slug: string;
  title: string;
  lang: Locale;
}

/** Brand surfaces only (D-037): saffron, maroon, earth. */
const TONES = ["brand-saffron", "brand-maroon", "brand-earth"];

function Row({
  href,
  title,
  sub,
  lang,
  tag,
  icon,
  tone = 0,
  cycle,
  cta,
  badge,
  light,
}: {
  href: string;
  title: string;
  sub?: string;
  lang?: Locale;
  tag?: string;
  icon: IconName;
  tone?: number;
  cycle?: number;
  cta: string;
  badge?: string;
  light?: boolean;
}) {
  const look = light
    ? "border border-divider bg-surface text-text shadow-elev-1"
    : `brand-glow text-white shadow-elev-2 ${TONES[tone % TONES.length]}`;
  return (
    <li className="flex">
      <Link href={href} className={`tile group flex min-h-[13rem] flex-1 flex-col gap-4 p-6 ${look}`}>
        {!light && <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-white/10" />}
        <span className="flex items-start justify-between gap-3">
          {cycle ? (
            <span aria-hidden="true" className="relative block h-12 w-12">
              <span className="orb absolute inset-0" style={{ animationDuration: `${cycle}s` }} />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className={`flex h-12 w-12 items-center justify-center rounded-full ${light ? "bg-primary-tint text-primary" : "bg-white/15 text-[#F3D98B]"}`}
            >
              <Icon name={icon} size={24} />
            </span>
          )}
          {badge ? (
            <span className="rounded-full bg-[#F5B22E] px-2.5 py-1 text-caption font-bold text-[#35180A]">{badge}</span>
          ) : tag ? (
            <span className={`rounded-full px-2.5 py-1 text-caption font-semibold ${light ? "bg-surface-2 text-text-muted" : "glass text-white"}`}>{tag}</span>
          ) : null}
        </span>
        <span className="flex-1">
          <span className="block font-display text-[1.625rem] font-semibold leading-tight [&_.ms-2]:!border-white/40 [&_.ms-2]:!text-white">
            <span lang={lang}>{title}</span>
            {lang === "en" ? <EnglishMark onDark={!light} /> : null}
          </span>
          {sub ? <span className={`mt-1 block text-small ${light ? "text-text-muted" : "text-white/85"}`}>{sub}</span> : null}
        </span>
        <span
          className={`inline-flex min-h-11 items-center gap-2 self-start rounded-full px-5 text-small font-semibold transition-colors ${
            light ? "bg-primary text-on-primary group-hover:bg-primary-pressed" : "bg-white text-[#5A1E0C] group-hover:bg-[#FFF4E0]"
          }`}
        >
          {cta}
          <Icon name="ArrowRight" size={16} />
        </span>
      </Link>
    </li>
  );
}

export function PracticeHome({ techniques, meditations, more }: { techniques: TechniqueSummary[]; meditations: MeditationSummary[]; /** Chakras and Yatra entry cards (server-rendered). */ more?: React.ReactNode }) {
  const s = useS();
  const { locale } = useI18n();
  const [progress, setProgress] = useState<{ p: Progress; today: string } | null>(null);

  useEffect(() => {
    let alive = true;
    const update = () =>
      void loadProgress().then((p) => {
        if (alive) setProgress({ p, today: todayKey() });
      });
    update();
    const onVis = () => document.visibilityState === "visible" && update();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  const first = techniques[0];

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader deva="प्राणायाम · ध्यान" title={s("practice.title")} intro={s("practice.intro")} />
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        {first ? (
          <section
            aria-labelledby="pr-start"
            className="brand-earth brand-glow relative isolate flex flex-col justify-between gap-5 overflow-hidden rounded-[var(--r-xl)] p-6 text-white shadow-elev-2 sm:p-8"
          >
            <span aria-hidden="true" className="absolute -right-6 -top-6 -z-10 block h-36 w-36 opacity-60">
              <span className="orb absolute inset-0" style={{ animationDuration: `${first.cycle ?? 8}s` }} />
            </span>
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-[#F5B22E] px-3 py-1 text-small font-bold text-[#35180A]">
                <Icon name="Sparkle" size={14} />
                {s("practice.startHere")}
              </p>
              <h2 id="pr-start" className="mt-3 max-w-md font-display text-[1.875rem] font-semibold leading-tight text-white">
                {s("practice.hero.title", { name: first.name })}
              </h2>
              <p className="mt-1 max-w-md text-[#F3E4CC]">{s("practice.hero.sub")}</p>
            </div>
            <Link
              href={practiceRoutes.breath(locale, first.slug)}
              className="inline-flex min-h-12 items-center gap-2 self-start rounded-full bg-[#F5B22E] px-6 font-semibold text-[#35180A] shadow-elev-1 hover:bg-[#F8C04D]"
            >
              <Icon name="Wind" size={18} />
              {s("practice.cta.breathe")}
            </Link>
          </section>
        ) : null}
        <div className="flex">
          {progress ? (
            <div className="flex-1 [&>*]:h-full">
              <ProgressCard progress={progress.p} today={progress.today} />
            </div>
          ) : (
            <div aria-busy="true" className="min-h-[168px] flex-1" />
          )}
        </div>
      </div>

      <section aria-labelledby="breathe-h">
        <h2 id="breathe-h" className="text-[1.75rem] leading-9">{s("practice.breathe.title")}</h2>
        <p className="mb-4 text-text-muted">{s("practice.breathe.sub")}</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {techniques.map((t, i) => (
            <Row
              key={t.slug}
              tone={i}
              cycle={t.cycle}
              icon="Wind"
              href={practiceRoutes.breath(locale, t.slug)}
              title={t.name}
              lang={t.lang}
              sub={t.subtitle}
              badge={i === 0 ? s("practice.firstPick") : undefined}
              tag={t.rhythm}
              cta={s("practice.cta.start")}
            />
          ))}
        </ul>
        <p className="mt-3 text-small text-text-muted">{s("tech.noHold")}</p>
      </section>

      <section aria-labelledby="meditate-h">
        <h2 id="meditate-h" className="text-[1.75rem] leading-9">{s("practice.meditate.title")}</h2>
        <p className="mb-4 text-text-muted">{s("practice.meditate.sub")}</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Row light icon="Timer" href={practiceRoutes.stillness(locale, SILENT_ID)} title={s("practice.silent.title")} sub={s("practice.silent.sub")} cta={s("practice.cta.start")} />
          {meditations.map((m) => (
            <Row
              light
              key={m.slug}
              icon="FlowerLotus"
              href={practiceRoutes.stillness(locale, m.slug)}
              title={m.title}
              lang={m.lang}
              sub={s("practice.guided.sub")}
              cta={s("practice.cta.start")}
            />
          ))}
        </ul>
        <p className="mt-3 text-small text-text-muted">{s("practice.ambienceNote")}</p>
      </section>

      <section aria-labelledby="yoga-h">
        <h2 id="yoga-h" className="text-[1.75rem] leading-9">{s("yoga.title")}</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Row tone={3} icon="PersonSimpleTaiChi" href={yogaRoutes.home(locale)} title={s("yoga.title")} sub={s("yoga.entry.sub")} cta={s("practice.cta.open")} />
          {more}
        </ul>
      </section>
    </div>
  );
}
