/** Entry card for the Practice page (server component; reads its own strings from content/yatra/_ui.json). */
import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { Locale } from "@/lib/types";
import { loadYatraStrings } from "./content.server";
import { yatraRoutes } from "./routes";

export function YatraLink({ locale }: { locale: Locale }) {
  const s = loadYatraStrings(locale);
  return (
    <li className="flex">
      <Link href={yatraRoutes.list(locale)} className="card-lift flex flex-1 flex-col gap-3 rounded-2xl border border-divider bg-surface p-5 shadow-elev-1">
        <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-tint text-primary">
          <Icon name="Bank" size={22} />
        </span>
        <span className="block font-display text-[1.375rem] font-semibold leading-tight">{s["yatra.title"]}</span>
        <span className="block text-small text-text-muted">{s["yatra.entry"]}</span>
      </Link>
    </li>
  );
}
