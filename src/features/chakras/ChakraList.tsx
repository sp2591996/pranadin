"use client";

import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { useI18n } from "@/i18n/client";
import { routes } from "@/lib/routes";
import { useS } from "@/features/shared/strings";
import { ChakraMotif } from "./Motif";
import { chakraRoutes } from "./routes";
import type { ChakraView } from "./types";

/** Chakras list (D-026 Wave C): seven centres as yogic tradition, never as health advice. */
export function ChakraList({ chakras }: { chakras: ChakraView[] }) {
  const s = useS();
  const { locale } = useI18n();
  return (
    <div className="flex flex-col gap-5">
      <Link href={routes.practice(locale)} className="inline-flex min-h-11 items-center text-primary underline underline-offset-2">
        {s("chakras.backToPractice")}
      </Link>
      <div>
        <h1>{s("chakras.title")}</h1>
        <p className="text-text-muted">{s("chakras.intro")}</p>
      </div>
      <ol className="flex flex-col gap-3">
        {chakras.map((c) => (
          <li key={c.id}>
            <Link
              href={chakraRoutes.detail(locale, c.id)}
              className="flex min-h-20 items-center gap-4 rounded-lg border-2 border-[var(--card-border)] bg-[var(--card-bg)] p-3 hover:bg-surface-2"
            >
              <ChakraMotif n={c.n} petals={c.petals} hex={c.hex} className="h-16 w-16 shrink-0" />
              <span className="flex-1">
                <span className="block text-h3" lang="sa">
                  {c.sa}
                </span>
                <span className="block font-semibold">
                  {c.iast} · <span lang={c.nick.lang}>{c.nick.text}</span>
                </span>
                <span className="block text-small text-text-muted" lang={c.meaning.lang}>
                  {c.meaning.text}
                </span>
              </span>
              <CaretRightIcon size={20} aria-hidden="true" className="text-text-muted" />
            </Link>
          </li>
        ))}
      </ol>
      <p className="text-small text-text-muted">{s("chakras.disclaimer")}</p>
    </div>
  );
}
