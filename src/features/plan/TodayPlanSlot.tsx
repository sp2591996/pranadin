/**
 * Server wrapper for Today's plan (QA-01). Dev-1 places it on Today:
 *
 *   // today/page.tsx
 *   <TodayView ... plan={<TodayPlanSlot locale={locale} />} />
 *
 * It reads Content's plan cards and strings at build time and renders the
 * client component, so Today ships only the active language.
 */
import type { Locale } from "@/lib/types";
import { loadPlanContent, loadStrings } from "@/features/shared/content.server";
import { StringsProvider } from "@/features/shared/strings";
import { TodayPlan } from "./TodayPlan";

const PREFIXES = ["today.plan.", "today.welcomeBack.", "today.first", "step.", "a11y.step"];

export function TodayPlanSlot({ locale }: { locale: Locale }) {
  return (
    <StringsProvider strings={loadStrings(locale, PREFIXES)}>
      <TodayPlan content={loadPlanContent(locale)} />
    </StringsProvider>
  );
}
