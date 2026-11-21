import { CalendarView } from "@/components/calendar/CalendarView";
import { BUILD_DATE, loadObservances } from "@/content/load";
import { OBSERVANCE_TRADITIONS } from "@/content/schema";
import { festivalLinkData } from "@/features/festivals/link-data.server";
import { isLocale } from "@/i18n/config";

/** Calendar (E-06, US-18, US-19). Observances are read at build time; dates are matched on the device. */
export default async function CalendarPage({ params }: PageProps<"/[locale]/calendar">) {
  const { locale } = await params;
  const l = isLocale(locale) ? locale : "en";
  const table = loadObservances(l);
  // Chips only for traditions that have at least one date in the list.
  const present = new Set(table.items.flatMap((o) => o.traditions));
  const traditions = OBSERVANCE_TRADITIONS.filter((tr) => present.has(tr));
  return <CalendarView observances={table.items} window={table.window} traditions={traditions} buildDate={BUILD_DATE} festivals={festivalLinkData(l)} />;
}
