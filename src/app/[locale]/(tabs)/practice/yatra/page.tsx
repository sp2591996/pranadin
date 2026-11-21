import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { loadPlaces, loadYatraStrings } from "@/features/yatra/content.server";
import { YatraList } from "@/features/yatra/YatraList";

/** Yatra travel guide: place list (D-026 Wave E). Information only, no bookings. */
export default async function YatraPage({ params }: PageProps<"/[locale]/practice/yatra">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  const places = loadPlaces(locale);
  const list = places.map((p) => ({ ...p, itineraries: [], sights: [], darshan: { ...p.darshan, tips: [] }, stay: [], food: [], health: [], etiquette: [], nearby: [], seasons: [], festivals: [], sources: [], photos: [] }));
  return (
    <StringsProvider strings={loadYatraStrings(locale)}>
      <YatraList places={list} />
    </StringsProvider>
  );
}
