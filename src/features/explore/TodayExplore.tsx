/**
 * "Explore your path" bento on Today (D-036). Every tile looks different so
 * each section has its own face: a photo for Yatra and Yoga, a dark tile with
 * moving sound bars, a breathing orb, the chakra rainbow, a paper journal
 * prompt. Server component (CSS motion only); the "next sacred day" tile is
 * added by TodayView, which knows the device's date. Tiles are <li>s for the
 * grid that TodayView draws; `order-*` keeps the layout fixed.
 */
import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { IconName } from "@/components/icons.generated";
import { loadChakraStrings } from "@/features/chakras/content.server";
import { chakraRoutes } from "@/features/chakras/routes";
import { practiceRoutes, SILENT_ID } from "@/features/practice/routes";
import { loadStrings } from "@/features/shared/content.server";
import { loadYatraStrings } from "@/features/yatra/content.server";
import { yatraRoutes } from "@/features/yatra/routes";
import { yogaRoutes } from "@/features/yoga/routes";
import { routes } from "@/lib/routes";
import type { Locale } from "@/lib/types";

function Arrow({ light }: { light?: boolean }) {
  return (
    <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-fast group-hover:translate-x-1 ${light ? "bg-[#fff]/20 text-[#fff]" : "bg-text text-bg"}`}>
      <Icon name="ArrowRight" size={16} />
    </span>
  );
}

function Label({ icon, children, light }: { icon: IconName; children: React.ReactNode; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-semibold ${light ? "glass text-[#fff]" : "bg-surface/80 text-text"}`}>
      <Icon name={icon} size={14} />
      {children}
    </span>
  );
}

export function TodayExplore({ locale }: { locale: Locale }) {
  const ui = loadStrings(locale, ["today.path", "today.bento", "today.journal", "today.hero.aiPhoto", "today.photoBy", "nav.", "practice.breathe.sub", "practice.meditate.sub", "yoga.entry"]);
  const ch = loadChakraStrings(locale);
  const ya = loadYatraStrings(locale);
  const ai = ui["today.hero.aiPhoto"];
  const linkBase = "group flex h-full flex-col justify-between gap-3 p-5";
  return (
    <>
      {/* Yatra: big photo, 2×2 */}
      <li className="tile reveal order-1 col-span-2 row-span-2 min-h-[20rem] bg-[#2A1408] shadow-elev-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- server tile, no JS */}
        <img src="/yatra/kedarnath/photo-1.webp" alt="" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <span aria-hidden="true" className="photo-shade absolute inset-0 -z-10" />
        <Link href={yatraRoutes.list(locale)} className={`${linkBase} p-6 text-[#fff] sm:p-7`}>
          <span className="flex flex-wrap items-start justify-between gap-2">
            <Label icon="Bank" light>
              {ui["nav.yatra"]}
            </Label>
            <span className="glass rounded-full px-2.5 py-1 text-caption text-[#fff]">
              {ui["today.photoBy"]?.replace("{credit}", "")}
              <span lang="en">Shivam Kumar 766, CC BY-SA 4.0</span>
            </span>
          </span>
          <span className="flex items-end justify-between gap-3">
            <span className="min-w-0">
              <span className="block font-display text-[2rem] font-semibold leading-[1.1] sm:text-[2.5rem]">{ya["yatra.title"]}</span>
              <span className="mt-2 line-clamp-3 max-w-md text-[#F3E4CC]">{ya["yatra.entry"]}</span>
            </span>
            <Arrow light />
          </span>
        </Link>
      </li>

      {/* Yoga: tall pose photo */}
      <li className="tile reveal order-2 row-span-2 min-h-[20rem] bg-[#F1E3CC] shadow-elev-1">
        {/* eslint-disable-next-line @next/next/no-img-element -- server tile, no JS */}
        <img src="/yoga/vrikshasana.webp" alt="" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <span aria-hidden="true" className="photo-shade absolute inset-0 -z-10" />
        <Link href={yogaRoutes.home(locale)} className={`${linkBase} text-[#fff]`}>
          <span className="flex flex-col items-start gap-2">
            <Label icon="PersonSimpleTaiChi" light>
              {ui["nav.yoga"]}
            </Label>
          </span>
          <span>
            <span className="block font-display text-[1.75rem] font-semibold leading-tight">{ui["today.path.yoga"]}</span>
            <span className="mt-1 line-clamp-3 text-small text-[#F3E4CC]">{ui["yoga.entry.sub"]}</span>
            <span className="mt-2 block text-caption text-[#E9D6B5]">{ai}</span>
          </span>
        </Link>
      </li>

      {/* Sounds: dark tile with moving bars */}
      <li className="tile reveal brand-earth order-3 shadow-elev-2">
        <Link href={routes.sounds(locale)} className={`${linkBase} text-[#fff]`}>
          <span className="flex items-start justify-between gap-2">
            <span aria-hidden="true" className="eq text-[#F5B22E]">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <span aria-hidden="true" className="font-deva text-2xl leading-none text-[#F3C35B]">
              ॐ
            </span>
          </span>
          <span>
            <span className="block font-display text-[1.5rem] font-semibold leading-tight">{ui["today.path.sounds"]}</span>
            <span className="line-clamp-2 text-small text-[#E9D6B5]">{ui["today.path.soundsSub"]}</span>
          </span>
        </Link>
      </li>

      {/* Breath: expanding orb */}
      <li className="tile reveal brand-saffron brand-glow order-5 shadow-elev-1">
        <Link href={routes.practice(locale)} className={`${linkBase} text-[#fff]`}>
          <span aria-hidden="true" className="relative ml-2 mt-2 block h-12 w-12">
            <span className="orb absolute inset-0" />
          </span>
          <span>
            <span className="block font-display text-[1.5rem] font-semibold leading-tight">{ui["today.path.breath"]}</span>
            <span className="line-clamp-2 text-small text-[#F8E2C8]">{ui["practice.breathe.sub"]}</span>
          </span>
        </Link>
      </li>

      {/* Meditate: twilight */}
      <li className="tile reveal brand-maroon brand-glow order-6 shadow-elev-1">
        <Link href={practiceRoutes.stillness(locale, SILENT_ID)} className={`${linkBase} text-[#fff]`}>
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff]/15 text-[#F3D98B]">
            <Icon name="Timer" size={22} />
          </span>
          <span>
            <span className="block font-display text-[1.5rem] font-semibold leading-tight">{ui["today.path.meditate"]}</span>
            <span className="line-clamp-2 text-small text-[#F3D9CC]">{ui["practice.meditate.sub"]}</span>
          </span>
        </Link>
      </li>

      {/* Chakras: rainbow */}
      <li className="tile reveal brand-earth brand-glow order-7 shadow-elev-1">
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[#000]/35" />
        <Link href={chakraRoutes.list(locale)} className={`${linkBase} text-[#fff]`}>
          <span aria-hidden="true" className="flex gap-1">
            {["#D8432F", "#EE8A2C", "#E7C23A", "#3FAE6A", "#2F9FD8", "#4B5BD6", "#8E3FB4"].map((c) => (
              <span key={c} className="h-3 w-3 rounded-full ring-2 ring-[#fff]/60" style={{ background: c }} />
            ))}
          </span>
          <span>
            <span className="block font-display text-[1.5rem] font-semibold leading-tight">{ch["chakras.title"]}</span>
            <span className="line-clamp-2 text-small text-[#fff]">{ch["chakras.intro"]}</span>
          </span>
        </Link>
      </li>

      {/* Journal: paper prompt */}
      <li className="tile reveal paper-texture order-8 border border-divider bg-surface shadow-elev-1">
        <Link href={routes.journal(locale)} className={`${linkBase} text-text`}>
          <span className="flex items-start justify-between gap-2">
            <Label icon="Notebook">{ui["nav.journal"]}</Label>
          </span>
          <span>
            <span className="block font-display text-[1.375rem] italic leading-snug text-primary">“{ui["today.journal.prompt"]}”</span>
            <span className="mt-1 line-clamp-2 text-small text-text-muted">{ui["today.path.journalSub"]}</span>
          </span>
        </Link>
      </li>
    </>
  );
}
