import { TodayView } from "@/components/today/TodayView";
import { BUILD_DATE, loadObservances } from "@/content/load";
import { isLocale } from "@/i18n/config";
import { TodayPlanSlot } from "@/features/plan/TodayPlanSlot";

/**
 * Today (E-06). The observance table is read at build time. The HTML is
 * pre-rendered for the build date (fast first paint); the device switches to
 * its own date and city on load.
 */
export default async function TodayPage({ params }: PageProps<"/[locale]/today">) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "en";
  const table = loadObservances(l);
  return <TodayView observances={table.items} window={table.window} buildDate={BUILD_DATE} plan={<TodayPlanSlot locale={l} />} />;
}
