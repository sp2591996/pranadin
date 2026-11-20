import { isLocale } from "@/i18n/config";
import { loadStrings } from "@/features/shared/content.server";
import { StringsProvider } from "@/features/shared/strings";
import { SoundsView } from "@/features/sounds/SoundsView";

const PREFIXES = ["sounds.", "japa."];

/** Sounds tab (D-026): recordings, generated sounds, scenes, sleep timer and japa mala. */
export default async function SoundsPage({ params }: PageProps<"/[locale]/sounds">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  return (
    <StringsProvider strings={loadStrings(locale, PREFIXES)}>
      <SoundsView />
    </StringsProvider>
  );
}
