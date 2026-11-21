/** Entry card for the Practice page (server component; reads its own strings from content/yatra/_ui.json). */
import Link from "next/link";
import type { Locale } from "@/lib/types";
import { loadYatraStrings } from "./content.server";
import { yatraRoutes } from "./routes";

export function YatraLink({ locale }: { locale: Locale }) {
  const s = loadYatraStrings(locale);
  return (
    <Link href={yatraRoutes.list(locale)} className="mt-4 block rounded-lg border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-4 hover:bg-surface-2">
      <span className="block text-h3">{s["yatra.title"]}</span>
      <span className="block text-small text-text-muted">{s["yatra.entry"]}</span>
    </Link>
  );
}
