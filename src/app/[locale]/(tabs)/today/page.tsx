import { TodayView } from "@/components/today/TodayView";
import { BUILD_DATE, loadObservances } from "@/content/load";
import { festivalLinkData } from "@/features/festivals/link-data.server";
import { isLocale } from "@/i18n/config";
import { TodayPlanSlot } from "@/features/plan/TodayPlanSlot";
import { TodayVerseSlot } from "@/features/wisdom/TodayVerseSlot";
import { TodayExplore } from "@/features/explore/TodayExplore";

/**
 * Today (E-06). The observance table is read at build time. The HTML is
 * pre-rendered for the build date (fast first paint); the device switches to
 * its own date and city on load.
 */
export default async function TodayPage({ params }: PageProps<"/[locale]/today">) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "en";
  const table = loadObservances(l);
  return <TodayView observances={table.items} window={table.window} buildDate={BUILD_DATE} festivals={festivalLinkData(l)} plan={<TodayPlanSlot locale={l} />} verse={<TodayVerseSlot locale={l} buildDate={BUILD_DATE} />} explore={<TodayExplore locale={l} />} />;
}
