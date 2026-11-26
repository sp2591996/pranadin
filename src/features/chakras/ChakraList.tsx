"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useI18n } from "@/i18n/client";
import { routes } from "@/lib/routes";
import { useS } from "@/features/shared/strings";
import { ChakraMotif } from "./Motif";
import { chakraRoutes } from "./routes";
import type { ChakraView } from "./types";
import { SectionHeader } from "@/components/SectionHeader";

/** Chakras list (D-026 Wave C): seven centres as yogic tradition, never as health advice. */
export function ChakraList({ chakras }: { chakras: ChakraView[] }) {
  const s = useS();
  const { locale } = useI18n();
  return (
    <div className="wide flex flex-col gap-6">
      <Link href={routes.practice(locale)} className="inline-flex min-h-11 items-center gap-1.5 self-start text-small font-semibold text-primary hover:underline">
        <Icon name="ArrowLeft" size={16} />
        {s("chakras.backToPractice")}
      </Link>
      <SectionHeader deva="चक्र" title={s("chakras.title")} intro={s("chakras.intro")} />
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chakras.map((c) => (
          <li key={c.id} className="flex">
            <Link
              href={chakraRoutes.detail(locale, c.id)}
              className="card-lift flex flex-1 items-center gap-4 rounded-2xl border border-divider bg-surface p-5 shadow-elev-1"
            >
              <ChakraMotif n={c.n} petals={c.petals} hex={c.hex} className="h-16 w-16 shrink-0" />
              <span className="flex-1">
                <span className="block font-deva text-h3" lang="sa">
                  {c.sa}
                </span>
                <span className="block font-semibold">
                  {c.iast} · <span lang={c.nick.lang}>{c.nick.text}</span>
                </span>
                <span className="block text-small text-text-muted" lang={c.meaning.lang}>
                  {c.meaning.text}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mx-auto max-w-3xl text-center text-small text-text-muted">{s("chakras.disclaimer")}</p>
    </div>
  );
}
