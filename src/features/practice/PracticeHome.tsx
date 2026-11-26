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

/** Rich gradients, each with white text at 4.5:1 or better (D-036). */
const TONES = [
  "from-[#2F7D74] to-[#163F45]",
  "from-[#A8431A] to-[#5E220B]",
  "from-[#4A3A7A] to-[#1F1638]",
  "from-[#2F6B3F] to-[#173621]",
  "from-[#7A2F5A] to-[#3A1229]",
  "from-[#2D4F86] to-[#15284A]",
];

function Row({ href, title, sub, lang, tag, icon, tone = 0, cycle }: { href: string; title: string; sub?: string; lang?: Locale; tag?: string; icon: IconName; tone?: number; cycle?: number }) {
  return (
    <li className="flex">
      <Link href={href} className={`tile group flex min-h-[13rem] flex-1 flex-col gap-4 bg-gradient-to-br p-6 text-white shadow-elev-2 ${TONES[tone % TONES.length]}`}>
        <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-white/10" />
        <span className="flex items-start justify-between gap-3">
          {cycle ? (
            <span aria-hidden="true" className="relative block h-12 w-12">
              <span className="orb absolute inset-0" style={{ animationDuration: `${cycle}s` }} />
            </span>
          ) : (
            <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-[#F3D98B]">
              <Icon name={icon} size={24} />
            </span>
          )}
          {tag ? <span className="glass rounded-full px-2.5 py-1 text-caption font-semibold text-white">{tag}</span> : null}
        </span>
        <span className="flex-1">
          <span className="block font-display text-[1.625rem] font-semibold leading-tight [&_.ms-2]:!border-white/40 [&_.ms-2]:!text-white">
            <span lang={lang}>{title}</span>
            {lang === "en" ? <EnglishMark /> : null}
          </span>
          {sub ? <span className="mt-1 block text-small text-white/85">{sub}</span> : null}
        </span>
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center self-end rounded-full bg-white/20 transition-transform duration-fast group-hover:translate-x-1">
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

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader deva="प्राणायाम · ध्यान" title={s("practice.title")} intro={s("practice.intro")} />
      <div className="mx-auto w-full max-w-3xl">
        {progress ? <ProgressCard progress={progress.p} today={progress.today} /> : <div aria-busy="true" className="min-h-[168px]" />}
      </div>

      <section aria-labelledby="breathe-h">
        <h2 id="breathe-h" className="text-[1.75rem] leading-9">{s("practice.breathe.title")}</h2>
        <p className="mb-4 text-text-muted">{s("practice.breathe.sub")}</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {techniques.map((t, i) => (
            <Row key={t.slug} tone={i} cycle={t.cycle} icon="Wind" href={practiceRoutes.breath(locale, t.slug)} title={t.name} lang={t.lang} sub={t.subtitle} tag={t.rhythm} />
          ))}
        </ul>
        <p className="mt-3 text-small text-text-muted">{s("tech.noHold")}</p>
      </section>

      <section aria-labelledby="meditate-h">
        <h2 id="meditate-h" className="text-[1.75rem] leading-9">{s("practice.meditate.title")}</h2>
        <p className="mb-4 text-text-muted">{s("practice.meditate.sub")}</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Row tone={2} icon="Timer" href={practiceRoutes.stillness(locale, SILENT_ID)} title={s("practice.silent.title")} />
          {meditations.map((m, i) => (
            <Row key={m.slug} tone={i + 4} icon="FlowerLotus" href={practiceRoutes.stillness(locale, m.slug)} title={m.title} lang={m.lang} />
          ))}
        </ul>
        <p className="mt-3 text-small text-text-muted">{s("practice.ambienceNote")}</p>
      </section>

      <section aria-labelledby="yoga-h">
        <h2 id="yoga-h" className="text-[1.75rem] leading-9">{s("yoga.title")}</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Row tone={3} icon="PersonSimpleTaiChi" href={yogaRoutes.home(locale)} title={s("yoga.title")} sub={s("yoga.entry.sub")} />
          {more}
        </ul>
      </section>
    </div>
  );
}
