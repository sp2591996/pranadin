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
      <Link href={chakraRoutes.list(locale)} className="tile chakra-wash group flex min-h-[13rem] flex-1 flex-col justify-end gap-1 p-6 text-white shadow-elev-2">
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-black/40" />
        <span aria-hidden="true" className="glass mb-auto flex h-11 w-11 items-center justify-center rounded-full">
          <Icon name="Sun" size={22} />
        </span>
        <span className="block font-display text-[1.625rem] font-semibold leading-tight">{s["chakras.title"]}</span>
        <span className="line-clamp-2 text-small text-white">{s["chakras.intro"]}</span>
      </Link>
    </li>
  );
}
