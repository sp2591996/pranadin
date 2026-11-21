/**
 * Server wrapper for the verse-of-the-day card on Today:
 *   <TodayView ... verse={<TodayVerseSlot locale={l} buildDate={BUILD_DATE} />} />
 */
import type { Locale } from "@/lib/types";
import { StringsProvider } from "@/features/shared/strings";
import { loadVerses, loadWisdomStrings } from "./content.server";
import { VerseCard } from "./VerseCard";

export function TodayVerseSlot({ locale, buildDate }: { locale: Locale; buildDate: string }) {
  return (
    <StringsProvider strings={loadWisdomStrings(locale)}>
      <VerseCard verses={loadVerses(locale)} buildDate={buildDate} />
    </StringsProvider>
  );
}
