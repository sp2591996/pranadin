import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { loadFestivalStrings, loadFestivals } from "@/features/festivals/content.server";
import { FestivalList } from "@/features/festivals/FestivalList";

/** Festivals guide (D-026 Wave D). */
export default async function FestivalsPage({ params }: PageProps<"/[locale]/calendar/festivals">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  const festivals = loadFestivals(locale);
  const traditions = [...new Set(festivals.flatMap((f) => f.traditions))];
  return (
    <StringsProvider strings={loadFestivalStrings(locale)}>
      <FestivalList festivals={festivals} traditions={traditions} />
    </StringsProvider>
  );
}
