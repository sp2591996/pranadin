import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { loadModuleList, loadPoseList, loadProgramList, loadYogaStrings } from "@/features/yoga/content.server";
import { YogaHome } from "@/features/yoga/YogaHome";

/** Yoga (D-026): pose library, guided sessions and programmes. */
export default async function YogaPage({ params }: PageProps<"/[locale]/practice/yoga">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  return (
    <StringsProvider strings={loadYogaStrings(locale)}>
      <YogaHome poses={loadPoseList(locale)} modules={loadModuleList(locale)} programs={loadProgramList(locale)} />
    </StringsProvider>
  );
}
