import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { loadStrings } from "@/features/shared/content.server";
import { clubIds, loadClubs, loadStoryStrings } from "@/features/stories/content.server";
import { ClubPage } from "@/features/stories/StoryViews";

export const dynamicParams = false;

export function generateStaticParams() {
  return clubIds().map((club) => ({ club }));
}

/** One story collection, e.g. the Ramayana, with its chapters by part (D-040). */
export default async function StoryClubPage({ params }: PageProps<"/[locale]/calendar/stories/[club]">) {
  const { locale: l, club } = await params;
  const locale = isLocale(l) ? l : "en";
  const clubs = loadClubs(locale);
  const c = clubs.find((x) => x.id === club);
  if (!c) notFound();
  const tr = loadStrings(locale, ["tradition."]);
  const trad = Object.fromEntries(Object.entries(tr).map(([k, v]) => [k.replace("tradition.", ""), v]));
  return <ClubPage c={c} clubs={clubs} locale={locale} strings={loadStoryStrings(locale)} trad={trad} />;
}
