import type { ReactNode } from "react";
import { Mandala } from "./Mandala";

/**
 * Compact deep-brown page header (D-033): Devanagari eyebrow, serif title,
 * optional intro and actions, with a slow mandala behind. Text on it is
 * always light, in both themes.
 */
export function PageHero({ deva, title, intro, children, as: Tag = "header" }: { deva: string; title: ReactNode; intro?: ReactNode; children?: ReactNode; as?: "header" | "div" }) {
  return (
    <Tag className="hero-dark relative isolate overflow-hidden rounded-[var(--r-xl)] px-5 py-7 shadow-elev-3 sm:px-8 sm:py-9">
      <Mandala className="slow-spin absolute -top-14 right-0 -z-10 h-52 w-52 text-[#F3C35B] opacity-[0.13]" />
      <p aria-hidden="true" className="font-deva text-small text-[#F3C35B]">
        {deva}
      </p>
      <h1 className="mt-1 text-[#FDF3E1]">{title}</h1>
      {intro && <p className="mt-2 max-w-prose text-[#EBD7AE]">{intro}</p>}
      {children}
    </Tag>
  );
}
