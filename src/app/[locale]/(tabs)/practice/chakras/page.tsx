import { HubNav } from "@/components/HubNav";
import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { loadChakraStrings, loadChakras } from "@/features/chakras/content.server";
import { ChakraList } from "@/features/chakras/ChakraList";

/** Chakras (D-026 Wave C): seven centres, framed as yogic tradition. */
export default async function ChakrasPage({ params }: PageProps<"/[locale]/practice/chakras">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  return (
    <StringsProvider strings={loadChakraStrings(locale)}>
      <HubNav locale={locale} hub="practice" current="chakras" />
      <ChakraList chakras={loadChakras(locale)} />
    </StringsProvider>
  );
}
