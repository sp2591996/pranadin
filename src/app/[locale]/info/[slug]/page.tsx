import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AudioCredits } from "@/components/AudioCredits";
import { Markdown } from "@/components/Markdown";
import { SimpleScreen } from "@/components/SimpleScreen";
import { loadMessages, loadTrustPage } from "@/content/load";
import { isLocale, LOCALES, type Locale } from "@/i18n/config";
import { TRACKS } from "@/lib/audio-manifest";
import { routes, TRUST_PAGE_FILES, TRUST_PAGES, trustSlugForFile, type TrustPage } from "@/lib/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => TRUST_PAGES.map((slug) => ({ locale, slug })));
}

const isTrustPage = (s: string): s is TrustPage => (TRUST_PAGES as readonly string[]).includes(s);

function pageFor(locale: Locale, slug: TrustPage) {
  const file = TRUST_PAGE_FILES[slug];
  return file ? loadTrustPage(locale, file) : null;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/info/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isTrustPage(slug)) return {};
  const page = pageFor(locale, slug);
  return page ? { title: page.title } : {};
}

/** Trust and legal pages (C9, L1), rendered from Content's Markdown at build time. */
export default async function TrustPageRoute({ params }: PageProps<"/[locale]/info/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isTrustPage(slug)) notFound();
  const page = pageFor(locale, slug);
  const { messages } = loadMessages(locale);
  if (!page) {
    // Not delivered yet (privacy/terms from Legal; help from Dev-2's screen). Say so plainly.
    return (
      <SimpleScreen title={slug === "help" ? messages["help.title"] : messages["privacy.title"]}>
        <p className="text-text-muted">{messages["error.notFound"]}</p>
      </SimpleScreen>
    );
  }
  const resolveHref = (target: string) => {
    const s = trustSlugForFile(target.replace(/^\.?\//, "").replace(/\.md$/, ""));
    return s ? routes.trust(locale, s) : null;
  };
  return (
    <SimpleScreen title={page.title} titleLang={page.lang} englishOnly={page.fellBack}>
      <article lang={page.lang}>
        <Markdown source={page.markdown.replace(/^#\s+.*\n/, "")} resolveHref={resolveHref} />
      </article>
      {slug === "sources" ? (
        <AudioCredits
          labels={{
            title: messages["sounds.credits.title"],
            intro: messages["sounds.credits.intro"],
            author: messages["sounds.credits.author"],
            licence: messages["sounds.credits.licence"],
            source: messages["sounds.credits.source"],
            ai: messages["sounds.credits.ai"],
            generated: messages["sounds.credits.generated"],
            team: messages["sounds.credits.team"],
            madeForApp: messages["sounds.credits.madeForApp"],
            publicDomain: messages["sounds.credits.publicDomain"],
            sourceTitle: messages["sounds.credits.sourceTitle"],
            trackNames: Object.fromEntries(TRACKS.map((t) => [t.file, (messages as Record<string, string>)[`sounds.track.${t.id}`] ?? t.name])),
          }}
        />
      ) : null}
    </SimpleScreen>
  );
}
