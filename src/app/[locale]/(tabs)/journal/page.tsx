import { isLocale } from "@/i18n/config";
import { loadJournalContent, loadStrings } from "@/features/shared/content.server";
import { StringsProvider } from "@/features/shared/strings";
import { JournalView } from "@/features/journal/JournalView";

const PREFIXES = ["journal.", "error.storage", "error.generic"];

/** Journal tab (E-10, Dev-2). Prompts and moods come from content/en/journal.json. */
export default async function JournalPage({ params }: PageProps<"/[locale]/journal">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  return (
    <StringsProvider strings={loadStrings(locale, PREFIXES)}>
      <JournalView content={loadJournalContent(locale)} />
    </StringsProvider>
  );
}
