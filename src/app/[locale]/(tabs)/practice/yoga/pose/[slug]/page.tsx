import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { allPoseSlugs, loadPose, loadYogaStrings } from "@/features/yoga/content.server";
import { PoseDetail } from "@/features/yoga/PoseDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPoseSlugs().map((slug) => ({ slug }));
}

export default async function PosePage({ params }: PageProps<"/[locale]/practice/yoga/pose/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = isLocale(l) ? l : "en";
  const found = loadPose(slug, locale);
  if (!found) notFound();
  return (
    <StringsProvider strings={loadYogaStrings(locale)}>
      <PoseDetail pose={found.pose} item={found.item} />
    </StringsProvider>
  );
}
