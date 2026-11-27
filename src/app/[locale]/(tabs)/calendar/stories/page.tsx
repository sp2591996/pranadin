import { HubNav } from "@/components/HubNav";
import { isLocale } from "@/i18n/config";
import { loadStrings } from "@/features/shared/content.server";
import { loadClubs, loadStoryStrings } from "@/features/stories/content.server";
import { StoryList } from "@/features/stories/StoryViews";

/** Story collections by faith (D-038, D-040). Server-rendered, no JavaScript. */
export default async function StoriesPage({ params }: PageProps<"/[locale]/calendar/stories">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  const tr = loadStrings(locale, ["tradition."]);
  const trad = Object.fromEntries(Object.entries(tr).map(([k, v]) => [k.replace("tradition.", ""), v]));
  return (
    <>
      <HubNav locale={locale} hub="calendar" current="stories" />
      <StoryList clubs={loadClubs(locale)} locale={locale} strings={loadStoryStrings(locale)} trad={trad} />
    </>
  );
}
