"use client";

import Link from "next/link";
import { Mandala } from "@/components/Mandala";
import { useI18n } from "@/i18n/client";
import { festivalRoutes } from "./routes";

/** Strings and the observance-to-festival map that Today and Calendar receive from the server. */
export interface FestivalLinkData {
  byObservance: Record<string, string>;
  readLabel: string;
  guideTitle: string;
  guideBody: string;
}

/** "Read the story and how to celebrate" under an observance card, when a guide entry exists. */
export function FestivalLink({ obsId, data }: { obsId: string; data?: FestivalLinkData }) {
  const { locale } = useI18n();
  const id = data?.byObservance[obsId];
  if (!data || !id) return null;
  return (
    <Link href={festivalRoutes.detail(locale, id)} className="inline-flex min-h-11 items-center text-small font-semibold text-primary underline underline-offset-2">
      {data.readLabel}
    </Link>
  );
}

/** Prominent "Festival guide" entry for the Calendar tab. */
export function FestivalGuideEntry({ data }: { data?: FestivalLinkData }) {
  const { locale } = useI18n();
  if (!data) return null;
  return (
    <Link
      href={festivalRoutes.list(locale)}
      className="relative isolate block overflow-hidden rounded-2xl border border-divider shadow-elev-1 bg-[var(--card-hero-bg)] p-4"
    >
      <Mandala className="absolute -right-8 -top-8 -z-10 h-32 w-32 text-[var(--accent)] opacity-40" />
      <span className="block text-h3">{data.guideTitle}</span>
      <span className="block text-small text-text-muted">{data.guideBody}</span>
    </Link>
  );
}
