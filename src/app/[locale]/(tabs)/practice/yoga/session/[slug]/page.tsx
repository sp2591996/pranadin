import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { StringsProvider } from "@/features/shared/strings";
import { allModuleSlugs, loadProgramList, loadSession, loadYogaStrings } from "@/features/yoga/content.server";
import { SessionPlayer } from "@/features/yoga/SessionPlayer";

export const dynamicParams = false;

export function generateStaticParams() {
  return allModuleSlugs().map((slug) => ({ slug }));
}

/** Guided session: /{locale}/practice/yoga/session/{slug}/ (programme days add ?prog=&day=). */
export default async function SessionPage({ params }: PageProps<"/[locale]/practice/yoga/session/[slug]">) {
  const { locale: l, slug } = await params;
  const locale = isLocale(l) ? l : "en";
  const session = loadSession(slug, locale);
  if (!session) notFound();
  const programs = loadProgramList(locale).map((p) => ({ id: p.id, title: p.title, titleLang: p.titleLang, modules: p.days.map((d) => d.module) }));
  return (
    <StringsProvider strings={loadYogaStrings(locale)}>
      <SessionPlayer module={session.module} item={session.item} poses={session.poses} programs={programs} />
    </StringsProvider>
  );
}
