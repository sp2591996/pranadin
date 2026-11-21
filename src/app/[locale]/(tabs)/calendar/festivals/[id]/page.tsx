import { notFound } from "next/navigation";
import { BUILD_DATE, loadObservances } from "@/content/load";
import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { festivalIds, loadFestivalStrings, loadFestivals } from "@/features/festivals/content.server";
import { FestivalDetail } from "@/features/festivals/FestivalDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return festivalIds().map((id) => ({ id }));
}

export default async function FestivalPage({ params }: PageProps<"/[locale]/calendar/festivals/[id]">) {
  const { locale: l, id } = await params;
  const locale = isLocale(l) ? l : "en";
  const festival = loadFestivals(locale).find((f) => f.id === id);
  if (!festival) notFound();
  return (
    <StringsProvider strings={loadFestivalStrings(locale)}>
      <FestivalDetail festival={festival} buildDate={BUILD_DATE} window={loadObservances(locale).window} />
    </StringsProvider>
  );
}
