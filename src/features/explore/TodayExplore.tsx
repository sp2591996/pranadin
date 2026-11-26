/**
 * "Your path today" on Today (D-033, after the reference prototype): one row
 * per section with an arrow. Server component; reads each section's own
 * strings, so Today ships only the active language.
 */
import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/icons.generated";
import { loadChakraStrings } from "@/features/chakras/content.server";
import { chakraRoutes } from "@/features/chakras/routes";
import { loadFestivalStrings } from "@/features/festivals/content.server";
import { festivalRoutes } from "@/features/festivals/routes";
import { practiceRoutes, SILENT_ID } from "@/features/practice/routes";
import { loadStrings } from "@/features/shared/content.server";
import { loadYatraStrings } from "@/features/yatra/content.server";
import { yatraRoutes } from "@/features/yatra/routes";
import { yogaRoutes } from "@/features/yoga/routes";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";

export function TodayExplore({ locale }: { locale: Locale }) {
  const ui = loadStrings(locale, ["today.path", "practice.breathe.sub", "practice.meditate.sub", "yoga.entry"]);
  const ch = loadChakraStrings(locale);
  const fe = loadFestivalStrings(locale);
  const ya = loadYatraStrings(locale);
  const rows: { href: string; icon: IconName; title: string; sub: string }[] = [
    { href: routes.calendar(locale), icon: "CalendarHeart", title: ui["today.path.panchang"] ?? "", sub: ui["today.path.panchangSub"] ?? "" },
    { href: practiceRoutes.stillness(locale, SILENT_ID), icon: "Timer", title: ui["today.path.meditate"] ?? "", sub: ui["practice.meditate.sub"] ?? "" },
    { href: yogaRoutes.home(locale), icon: "PersonSimpleTaiChi", title: ui["today.path.yoga"] ?? "", sub: ui["yoga.entry.sub"] ?? "" },
    { href: routes.practice(locale), icon: "Wind", title: ui["today.path.breath"] ?? "", sub: ui["practice.breathe.sub"] ?? "" },
    { href: routes.sounds(locale), icon: "Waveform", title: ui["today.path.sounds"] ?? "", sub: ui["today.path.soundsSub"] ?? "" },
    { href: chakraRoutes.list(locale), icon: "Sun", title: ch["chakras.title"] ?? "", sub: ch["chakras.intro"] ?? "" },
    { href: yatraRoutes.list(locale), icon: "Bank", title: ya["yatra.title"] ?? "", sub: ya["yatra.entry"] ?? "" },
    { href: festivalRoutes.list(locale), icon: "Flame", title: fe["festivals.title"] ?? "", sub: fe["festivals.intro"] ?? "" },
    { href: routes.journal(locale), icon: "Notebook", title: ui["today.path.journal"] ?? "", sub: ui["today.path.journalSub"] ?? "" },
  ];
  return (
    <section aria-labelledby="path-title" className="h-full rounded-[var(--r-xl)] border border-divider bg-surface p-6 shadow-elev-1 sm:p-7">
      <h2 id="path-title" className="text-[1.75rem] leading-9">
        {ui["today.path.title"]}
      </h2>
      <p className="text-text-muted">{ui["today.path.sub"]}</p>
      <ul className="mt-5 flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="group flex min-h-14 items-center gap-3 rounded-2xl border border-divider bg-bg/60 p-4 transition-colors duration-fast hover:border-[color-mix(in_srgb,var(--primary)_35%,var(--divider))] hover:bg-surface">
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                <Icon name={r.icon} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-text">{r.title}</span>
                <span className="line-clamp-2 block text-small text-text-muted">{r.sub}</span>
              </span>
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text transition-transform duration-fast group-hover:translate-x-0.5">
                <Icon name="ArrowRight" size={16} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
