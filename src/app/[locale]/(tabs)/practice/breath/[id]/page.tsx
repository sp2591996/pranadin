import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { loadStrings, loadTechniques } from "@/features/shared/content.server";
import { StringsProvider } from "@/features/shared/strings";
import { BreathPlayer } from "@/features/practice/BreathPlayer";

export const dynamicParams = false;

const PREFIXES = ["practice.", "breath.", "safety.", "tech.", "complete.", "streak.", "week.", "a11y.", "reminder.", "timer.muted", "onb.safety.cta"];

export function generateStaticParams() {
  return loadTechniques("en").map((t) => ({ id: t.slug }));
}

/** Breath player (E-08, Dev-2): /{locale}/practice/breath/{techniqueSlug}/ */
export default async function BreathPage({ params }: PageProps<"/[locale]/practice/breath/[id]">) {
  const { locale: l, id } = await params;
  const locale = isLocale(l) ? l : "en";
  const technique = loadTechniques(locale).find((t) => t.slug === id);
  if (!technique) notFound();
  const strings = loadStrings(locale, PREFIXES);
  return (
    <StringsProvider strings={strings}>
      <BreathPlayer technique={technique} caution={strings["safety.caution"] ?? ""} />
    </StringsProvider>
  );
}
