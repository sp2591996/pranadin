import { SimpleScreen } from "@/components/SimpleScreen";
import { isLocale } from "@/i18n/config";
import { loadStrings } from "@/features/shared/content.server";
import { StringsProvider } from "@/features/shared/strings";
import { Onboarding } from "@/features/onboarding/Onboarding";

const PREFIXES = ["onb.", "goal.", "when.", "privacy.readNotice"];

/** Onboarding (E-11, Dev-2): Language → Welcome + safety → Goal → Time & when → City → Analytics choice (FR-2). */
export default async function OnboardingPage({ params }: PageProps<"/[locale]/onboarding">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  return (
    <SimpleScreen titleKey="onboarding.title">
      <StringsProvider strings={loadStrings(locale, PREFIXES)}>
        <Onboarding />
      </StringsProvider>
    </SimpleScreen>
  );
}
