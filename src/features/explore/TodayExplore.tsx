/**
 * "Explore" grid on Today (D-033): icon-tile cards into the deeper sections.
 * Server component; reads each section's own strings, so Today needs no new
 * client strings.
 */
import Link from "next/link";
import { IconTile, type OrnamentName } from "@/components/Ornaments";
import { loadChakraStrings } from "@/features/chakras/content.server";
import { chakraRoutes } from "@/features/chakras/routes";
import { loadFestivalStrings } from "@/features/festivals/content.server";
import { festivalRoutes } from "@/features/festivals/routes";
import { loadStrings } from "@/features/shared/content.server";
import { loadYatraStrings } from "@/features/yatra/content.server";
import { yatraRoutes } from "@/features/yatra/routes";
import { yogaRoutes } from "@/features/yoga/routes";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";

export function TodayExplore({ locale }: { locale: Locale }) {
  const ui = loadStrings(locale, ["yoga.title", "yoga.entry", "japa.title", "japa.sub", "today.explore"]);
  const ch = loadChakraStrings(locale);
  const fe = loadFestivalStrings(locale);
  const ya = loadYatraStrings(locale);
  const items: { href: string; icon: OrnamentName; title: string; sub: string }[] = [
    { href: yogaRoutes.home(locale), icon: "lotus", title: ui["yoga.title"] ?? "Yoga", sub: ui["yoga.entry.sub"] ?? "" },
    { href: routes.sounds(locale), icon: "mala", title: ui["japa.title"] ?? "Japa", sub: ui["japa.sub"] ?? "" },
    { href: festivalRoutes.list(locale), icon: "diya", title: fe["festivals.title"] ?? "", sub: fe["festivals.intro"] ?? "" },
    { href: yatraRoutes.list(locale), icon: "temple", title: ya["yatra.title"] ?? "", sub: ya["yatra.entry"] ?? "" },
    { href: chakraRoutes.list(locale), icon: "chakra", title: ch["chakras.title"] ?? "", sub: ch["chakras.intro"] ?? "" },
  ];
  return (
    <section aria-labelledby="explore-title">
      <h2 id="explore-title" className="mb-3">
        {ui["today.explore.title"]}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.href} className="flex">
            <Link href={it.href} className="card-lift flex flex-1 items-start gap-4 rounded-2xl border border-divider bg-surface p-4 shadow-elev-1">
              <IconTile name={it.icon} />
              <span className="min-w-0">
                <span className="block font-display text-[1.375rem] font-semibold leading-tight text-text">{it.title}</span>
                <span className="mt-1 line-clamp-2 block text-small text-text-muted">{it.sub}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
