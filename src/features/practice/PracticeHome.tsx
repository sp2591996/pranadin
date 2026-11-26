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
  lang: Locale;
}
export interface MeditationSummary {
  slug: string;
  title: string;
  lang: Locale;
}

function Row({ href, title, sub, lang, tag, icon }: { href: string; title: string; sub?: string; lang?: Locale; tag?: string; icon: IconName }) {
  return (
    <li className="flex">
      <Link href={href} className="card-lift flex flex-1 flex-col gap-3 rounded-2xl border border-divider bg-surface p-5 shadow-elev-1">
        <span className="flex items-start justify-between gap-3">
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
            <Icon name={icon} size={22} />
          </span>
          {tag ? <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-caption font-semibold text-text-muted">{tag}</span> : null}
        </span>
        <span className="flex-1">
          <span className="block font-display text-[1.375rem] font-semibold leading-tight">
            <span lang={lang}>{title}</span>
            {lang === "en" ? <EnglishMark /> : null}
          </span>
          {sub ? <span className="mt-1 block text-small text-text-muted">{sub}</span> : null}
        </span>
        <span aria-hidden="true" className="flex items-center gap-1 text-small font-semibold text-primary">
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {techniques.map((t) => (
            <Row key={t.slug} icon="Wind" href={practiceRoutes.breath(locale, t.slug)} title={t.name} lang={t.lang} sub={t.subtitle} tag={t.rhythm} />
          ))}
        </ul>
        <p className="mt-3 text-small text-text-muted">{s("tech.noHold")}</p>
      </section>

      <section aria-labelledby="meditate-h">
        <h2 id="meditate-h" className="text-[1.75rem] leading-9">{s("practice.meditate.title")}</h2>
        <p className="mb-4 text-text-muted">{s("practice.meditate.sub")}</p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Row icon="Timer" href={practiceRoutes.stillness(locale, SILENT_ID)} title={s("practice.silent.title")} />
          {meditations.map((m) => (
            <Row key={m.slug} icon="FlowerLotus" href={practiceRoutes.stillness(locale, m.slug)} title={m.title} lang={m.lang} />
          ))}
        </ul>
        <p className="mt-3 text-small text-text-muted">{s("practice.ambienceNote")}</p>
      </section>

      <section aria-labelledby="yoga-h">
        <h2 id="yoga-h" className="text-[1.75rem] leading-9">{s("yoga.title")}</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Row icon="PersonSimpleTaiChi" href={yogaRoutes.home(locale)} title={s("yoga.title")} sub={s("yoga.entry.sub")} />
          {more}
        </ul>
      </section>
    </div>
  );
}
