import { notFound } from "next/navigation";
import { SimpleScreen } from "@/components/SimpleScreen";
import { LOCALES } from "@/i18n/config";
import { TRUST_PAGES, type TrustPage } from "@/lib/routes";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((locale) => TRUST_PAGES.map((slug) => ({ locale, slug })));
}

const isTrustPage = (s: string): s is TrustPage => (TRUST_PAGES as readonly string[]).includes(s);

/** Trust and legal pages (C9, L1). Body comes from `app/content/trust/<slug>.json` once Content delivers it. */
export default async function TrustPageRoute({ params }: PageProps<"/[locale]/info/[slug]">) {
  const { slug } = await params;
  if (!isTrustPage(slug)) notFound();
  return <SimpleScreen titleKey={`trust.${slug}`} />;
}
