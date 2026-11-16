import { TodayView } from "@/components/today/TodayView";
import { loadObservances } from "@/content/load";
import { isLocale } from "@/i18n/config";

/** Today (E-06). The observance table is read at build time; dates are matched on the device. */
export default async function TodayPage({ params }: PageProps<"/[locale]/today">) {
  const { locale } = await params;
  const table = loadObservances(isLocale(locale) ? locale : "en");
  return <TodayView observances={table.items} window={table.window} />;
}
