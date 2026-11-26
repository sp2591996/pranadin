/**
 * Entry card for the Practice page (server component, self-contained: it reads
 * its own strings from content/chakras.json, so the page needs no new prefixes).
 *   <ChakrasLink locale={locale} />
 */
import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Locale } from "@/lib/types";
import { loadChakraStrings } from "./content.server";
import { chakraRoutes } from "./routes";

export function ChakrasLink({ locale }: { locale: Locale }) {
  const s = loadChakraStrings(locale);
  return (
    <li className="flex">
      <Link href={chakraRoutes.list(locale)} className="card-lift flex flex-1 flex-col gap-3 rounded-2xl border border-divider bg-surface p-5 shadow-elev-1">
        <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
          <Icon name="Sun" size={22} />
        </span>
        <span className="block font-display text-[1.375rem] font-semibold leading-tight">{s["chakras.title"]}</span>
        <span className="block text-small text-text-muted">{s["chakras.intro"]}</span>
      </Link>
    </li>
  );
}
