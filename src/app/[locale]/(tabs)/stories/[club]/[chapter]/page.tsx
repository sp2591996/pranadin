import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { loadStrings } from "@/features/shared/content.server";
import { loadFestivals } from "@/features/festivals/content.server";
import { chapterParams, loadClubs, loadStoryStrings } from "@/features/stories/content.server";
import { ChapterPage } from "@/features/stories/StoryViews";
import { loadPlaces } from "@/features/yatra/content.server";

export const dynamicParams = false;

export function generateStaticParams() {
  return chapterParams();
}

/** One illustrated chapter of a story collection (D-040). */
export default async function StoryChapterPage({ params }: PageProps<"/[locale]/stories/[club]/[chapter]">) {
  const { locale: l, club, chapter } = await params;
  const locale = isLocale(l) ? l : "en";
  const clubs = loadClubs(locale);
  const c = clubs.find((x) => x.id === club);
  const st = c?.chapters.find((x) => x.id === chapter);
  if (!c || !st) notFound();
  const tr = loadStrings(locale, ["tradition."]);
  const trad = Object.fromEntries(Object.entries(tr).map(([k, v]) => [k.replace("tradition.", ""), v]));
  const placeName = st.place ? loadPlaces(locale).find((p) => p.id === st.place)?.name.text : undefined;
  const festivalName = st.festival ? loadFestivals(locale).find((f) => f.id === st.festival)?.name.text : undefined;
  return <ChapterPage c={c} st={st} clubs={clubs} locale={locale} strings={loadStoryStrings(locale)} trad={trad} placeName={placeName} festivalName={festivalName} />;
}
