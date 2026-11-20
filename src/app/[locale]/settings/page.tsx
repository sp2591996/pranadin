import { SimpleScreen } from "@/components/SimpleScreen";
import { isLocale } from "@/i18n/config";
import { loadJournalContent, loadStrings } from "@/features/shared/content.server";
import { StringsProvider } from "@/features/shared/strings";
import { Settings } from "@/features/settings/Settings";

const PREFIXES = ["me.", "textSize.", "privacy.", "help.", "theme.", "goal.", "when.", "reminder.", "journal.", "lang."];

/** "Me" / settings (E-11, Dev-2). Trust pages are one tap from here, two from any screen (FR-9). */
export default async function SettingsPage({ params }: PageProps<"/[locale]/settings">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  return (
    <SimpleScreen titleKey="settings.title">
      <StringsProvider strings={loadStrings(locale, PREFIXES)}>
        <Settings journal={loadJournalContent(locale)} />
      </StringsProvider>
    </SimpleScreen>
  );
}
