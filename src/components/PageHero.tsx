import type { ReactNode } from "react";
import { Mandala } from "./Mandala";

/**
 * Deep-brown banner with a gold ॐ (D-033, after the reference prototype's
 * Sounds page). Centred; text on it is always light, in both themes.
 */
export function PageHero({ deva, title, intro, children, as: Tag = "header" }: { deva: string; title: ReactNode; intro?: ReactNode; children?: ReactNode; as?: "header" | "div" }) {
  return (
    <Tag className="hero-dark relative isolate overflow-hidden rounded-[var(--r-xl)] px-6 py-9 text-center shadow-elev-3 sm:py-12">
      <Mandala className="slow-spin absolute -top-20 right-0 -z-10 h-[256px] w-[256px] text-[#F3C35B] opacity-[0.12]" />
      <Mandala className="slow-spin absolute -bottom-24 -left-20 -z-10 h-[224px] w-[224px] text-[#F3C35B] opacity-[0.08]" />
      <p aria-hidden="true" className="gentle-float font-deva text-5xl leading-none text-[#F3C35B] drop-shadow-[0_4px_18px_rgba(243,195,91,0.35)]">
        ॐ
      </p>
      <p aria-hidden="true" className="mt-3 font-deva text-small text-[#E9CF97]">
        {deva}
      </p>
      <h1 className="mt-1 text-[2.25rem] leading-[2.75rem] text-[#FDF3E1] sm:text-[2.75rem] sm:leading-[3.25rem]">{title}</h1>
      {intro && <p className="mx-auto mt-2 max-w-xl text-[#EBD7AE]">{intro}</p>}
      {children}
    </Tag>
  );
}
