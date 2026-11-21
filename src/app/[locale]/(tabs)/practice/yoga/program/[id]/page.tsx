import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { allProgramIds, loadProgramList, loadYogaStrings } from "@/features/yoga/content.server";
import { ProgramView } from "@/features/yoga/ProgramView";
import { programId, programSlug } from "@/features/yoga/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return allProgramIds().map((id) => ({ id: programSlug(id) }));
}

export default async function ProgramPage({ params }: PageProps<"/[locale]/practice/yoga/program/[id]">) {
  const { locale: l, id } = await params;
  const locale = isLocale(l) ? l : "en";
  const program = loadProgramList(locale).find((p) => p.id === programId(id));
  if (!program) notFound();
  return (
    <StringsProvider strings={loadYogaStrings(locale)}>
      <ProgramView program={program} />
    </StringsProvider>
  );
}
