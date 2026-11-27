import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { loadPlaces, loadYatraStrings, yatraIds } from "@/features/yatra/content.server";
import { PlaceDetail } from "@/features/yatra/PlaceDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return yatraIds().filter((id) => id !== "plan").map((id) => ({ id }));
}

export default async function PlacePage({ params }: PageProps<"/[locale]/yatra/[id]">) {
  const { locale: l, id } = await params;
  const locale = isLocale(l) ? l : "en";
  const places = loadPlaces(locale);
  const place = places.find((p) => p.id === id);
  if (!place) notFound();
  return (
    <StringsProvider strings={loadYatraStrings(locale)}>
      <PlaceDetail place={place} allIds={places.map((p) => p.id)} />
    </StringsProvider>
  );
}
