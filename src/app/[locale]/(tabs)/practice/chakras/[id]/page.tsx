import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { chakraIds, loadChakraStrings, loadChakras } from "@/features/chakras/content.server";
import { ChakraDetail } from "@/features/chakras/ChakraDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return chakraIds().map((id) => ({ id }));
}

export default async function ChakraPage({ params }: PageProps<"/[locale]/practice/chakras/[id]">) {
  const { locale: l, id } = await params;
  const locale = isLocale(l) ? l : "en";
  const chakra = loadChakras(locale).find((c) => c.id === id);
  if (!chakra) notFound();
  return (
    <StringsProvider strings={loadChakraStrings(locale)}>
      <ChakraDetail chakra={chakra} />
    </StringsProvider>
  );
}
