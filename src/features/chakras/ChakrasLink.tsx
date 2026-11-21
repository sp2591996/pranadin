/**
 * Entry card for the Practice page (server component, self-contained: it reads
 * its own strings from content/chakras.json, so the page needs no new prefixes).
 *   <ChakrasLink locale={locale} />
 */
import Link from "next/link";
import type { Locale } from "@/lib/types";
import { loadChakraStrings } from "./content.server";
import { chakraRoutes } from "./routes";

export function ChakrasLink({ locale }: { locale: Locale }) {
  const s = loadChakraStrings(locale);
  return (
    <Link href={chakraRoutes.list(locale)} className="mt-4 block rounded-lg border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-4 hover:bg-surface-2">
      <span className="block text-h3">{s["chakras.title"]}</span>
      <span className="block text-small text-text-muted">{s["chakras.intro"]}</span>
    </Link>
  );
}
