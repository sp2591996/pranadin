"use client";

/** Practice tab (E-08): streak, the 4 breath techniques and the meditation timer. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { useI18n } from "@/i18n/client";
import { todayKey } from "@/features/shared/device";
import { useS } from "@/features/shared/strings";
import { ProgressCard } from "./ProgressCard";
import { loadProgress } from "./store";
import type { Progress } from "./streak";
import { practiceRoutes, SILENT_ID } from "./routes";

export interface TechniqueSummary {
  slug: string;
  name: string;
  subtitle: string;
  rhythm: string;
}
export interface MeditationSummary {
  slug: string;
  title: string;
}

function Row({ href, title, sub }: { href: string; title: string; sub?: string }) {
  return (
    <li>
      <Link href={href} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-surface-2">
        <span className="flex-1">
          <span className="block font-semibold">{title}</span>
          {sub ? <span className="block text-[0.875rem] leading-5 text-text-muted">{sub}</span> : null}
        </span>
        <CaretRightIcon size={20} aria-hidden="true" className="text-text-muted" />
      </Link>
    </li>
  );
}

export function PracticeHome({ techniques, meditations }: { techniques: TechniqueSummary[]; meditations: MeditationSummary[] }) {
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
    <div className="flex flex-col gap-6">
      <h1>{s("practice.title")}</h1>
      {progress ? <ProgressCard progress={progress.p} today={progress.today} /> : <div aria-busy="true" className="min-h-[168px]" />}

      <section aria-labelledby="breathe-h">
        <h2 id="breathe-h">{s("practice.breathe.title")}</h2>
        <p className="mb-3 text-text-muted">{s("practice.breathe.sub")}</p>
        <ul className="divide-y divide-divider rounded-lg border border-divider bg-surface">
          {techniques.map((t) => (
            <Row key={t.slug} href={practiceRoutes.breath(locale, t.slug)} title={t.name} sub={`${t.subtitle} · ${t.rhythm}`} />
          ))}
        </ul>
        <p className="mt-2 text-[0.875rem] leading-5 text-text-muted">{s("tech.noHold")}</p>
      </section>

      <section aria-labelledby="meditate-h">
        <h2 id="meditate-h">{s("practice.meditate.title")}</h2>
        <p className="mb-3 text-text-muted">{s("practice.meditate.sub")}</p>
        <ul className="divide-y divide-divider rounded-lg border border-divider bg-surface">
          <Row href={practiceRoutes.stillness(locale, SILENT_ID)} title={s("practice.silent.title")} />
          {meditations.map((m) => (
            <Row key={m.slug} href={practiceRoutes.stillness(locale, m.slug)} title={m.title} />
          ))}
        </ul>
        <p className="mt-2 text-[0.875rem] leading-5 text-text-muted">{s("practice.ambienceNote")}</p>
      </section>
    </div>
  );
}
