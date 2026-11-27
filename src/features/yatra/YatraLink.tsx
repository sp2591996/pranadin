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
      <Link href={yatraRoutes.list(locale)} className="tile group flex min-h-[13rem] flex-1 flex-col justify-end gap-1 bg-[#2A1408] p-6 text-white shadow-elev-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- server card, no JS */}
        <img src="/yatra/kedarnath/photo-1.webp" alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <span aria-hidden="true" className="photo-shade absolute inset-0 -z-10" />
        <span aria-hidden="true" className="glass mb-auto flex h-11 w-11 items-center justify-center rounded-full">
          <Icon name="Bank" size={22} />
        </span>
        <span className="block font-display text-[1.625rem] font-semibold leading-tight">{s["yatra.title"]}</span>
        <span className="line-clamp-2 text-small text-[#F3E4CC]">{s["yatra.entry"]}</span>
      </Link>
    </li>
  );
}
