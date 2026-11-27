import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { loadCities, loadPlaces, loadYatraStrings } from "@/features/yatra/content.server";
import { Planner } from "@/features/yatra/Planner";

/** Simple trip planner: saved on the device, print or share as text. */
export default async function PlanPage({ params }: PageProps<"/[locale]/practice/yatra/plan">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  return (
    <StringsProvider strings={loadYatraStrings(locale)}>
      <Planner places={loadPlaces(locale)} cities={loadCities(locale)} />
    </StringsProvider>
  );
}
