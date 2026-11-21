import { isLocale } from "@/i18n/config";
import { loadMeditations, loadStrings, loadTechniques } from "@/features/shared/content.server";
import { StringsProvider } from "@/features/shared/strings";
import { formatMessage } from "@/features/shared/format-message";
import { PracticeHome } from "@/features/practice/PracticeHome";
import { ChakrasLink } from "@/features/chakras/ChakrasLink";

const PREFIXES = ["practice.", "tech.", "streak.", "week.", "progress.", "a11y.", "yoga.title", "yoga.entry.sub"];

/** Practice tab (E-08, Dev-2). Content is read at build time and passed to the client. */
export default async function PracticePage({ params }: PageProps<"/[locale]/practice">) {
  const { locale: l } = await params;
  const locale = isLocale(l) ? l : "en";
  const strings = loadStrings(locale, PREFIXES);
  const rhythmTpl = strings["tech.rhythmValue"] ?? "In {in} · Out {out} seconds";
  const techniques = loadTechniques(locale).map((t) => ({
    slug: t.slug,
    name: t.name,
    subtitle: t.subtitle,
    lang: t.lang,
    rhythm: formatMessage(
      rhythmTpl,
      {
        in: t.pattern.find((p) => p.phase === "inhale")?.seconds ?? 4,
        out: t.pattern.find((p) => p.phase === "exhale" || p.phase === "hum")?.seconds ?? 4,
      },
      locale,
    ),
  }));
  const meditations = loadMeditations(locale).map((m) => ({ slug: m.slug, title: m.title, lang: m.lang }));
  return (
    <StringsProvider strings={strings}>
      <PracticeHome techniques={techniques} meditations={meditations} />
      <ChakrasLink locale={locale} />
    </StringsProvider>
  );
}
