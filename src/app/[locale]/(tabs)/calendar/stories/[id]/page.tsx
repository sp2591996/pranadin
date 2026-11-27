import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { loadStrings } from "@/features/shared/content.server";
import { loadFestivals } from "@/features/festivals/content.server";
import { loadStories, loadStoryStrings, storyIds } from "@/features/stories/content.server";
import { StoryDetail } from "@/features/stories/StoryViews";
import { loadPlaces } from "@/features/yatra/content.server";

export const dynamicParams = false;

export function generateStaticParams() {
  return storyIds().map((id) => ({ id }));
}

/** One illustrated story (D-038). */
export default async function StoryPage({ params }: PageProps<"/[locale]/calendar/stories/[id]">) {
  const { locale: l, id } = await params;
  const locale = isLocale(l) ? l : "en";
  const all = loadStories(locale);
  const st = all.find((x) => x.id === id);
  if (!st) notFound();
  const tr = loadStrings(locale, ["tradition."]);
  const trad = Object.fromEntries(Object.entries(tr).map(([k, v]) => [k.replace("tradition.", ""), v]));
  const placeName = st.place ? loadPlaces(locale).find((p) => p.id === st.place)?.name.text : undefined;
  const festivalName = st.festival ? loadFestivals(locale).find((f) => f.id === st.festival)?.name.text : undefined;
  return <StoryDetail st={st} all={all} locale={locale} strings={loadStoryStrings(locale)} trad={trad} placeName={placeName} festivalName={festivalName} />;
}
