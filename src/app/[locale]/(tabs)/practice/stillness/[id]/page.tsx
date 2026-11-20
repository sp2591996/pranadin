import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { loadMeditations, loadStrings } from "@/features/shared/content.server";
import { StringsProvider } from "@/features/shared/strings";
import { SILENT_ID } from "@/features/practice/routes";
import { StillnessTimer } from "@/features/practice/StillnessTimer";

export const dynamicParams = false;

const PREFIXES = ["safety.", "practice.", "breath.", "timer.", "ambience.", "focus.", "complete.", "streak.", "week.", "a11y.", "reminder."];

export function generateStaticParams() {
  return [{ id: SILENT_ID }, ...loadMeditations("en").map((m) => ({ id: m.slug }))];
}

/** Meditation timer (E-08 + E-07*, Dev-2): /{locale}/practice/stillness/{silent|focusSlug}/ */
export default async function StillnessPage({ params }: PageProps<"/[locale]/practice/stillness/[id]">) {
  const { locale: l, id } = await params;
  const locale = isLocale(l) ? l : "en";
  const meditation = id === SILENT_ID ? null : (loadMeditations(locale).find((m) => m.slug === id) ?? null);
  if (id !== SILENT_ID && !meditation) notFound();
  const strings = loadStrings(locale, PREFIXES);
  return (
    <StringsProvider strings={strings}>
      <StillnessTimer
        caution={strings["safety.caution"] ?? ""}
        meditation={meditation}
        refId={meditation?.id ?? "med.silent"}
        silentTitle={strings["practice.silent.title"] ?? "Silent sit"}
        silentGuidance={strings["practice.silent.guidance"] ?? ""}
      />
    </StringsProvider>
  );
}
