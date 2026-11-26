import type { ReactNode } from "react";

/**
 * Centred page title (D-033, after the reference prototype): small saffron
 * Devanagari label, serif title, muted intro and a lotus divider.
 */
export function SectionHeader({ deva, title, intro, children, titleLang }: { deva: string; title: ReactNode; intro?: ReactNode; children?: ReactNode; titleLang?: string }) {
  return (
    <header className="mx-auto max-w-2xl text-center">
      <p aria-hidden="true" className="font-deva text-small text-primary">
        {deva}
      </p>
      <h1 lang={titleLang} className="mt-1 text-[2.25rem] leading-[2.75rem] text-text sm:text-[2.75rem] sm:leading-[3.25rem]">
        {title}
      </h1>
      {intro && <p className="mx-auto mt-2 max-w-xl text-text-muted">{intro}</p>}
      <LotusDivider />
      {children}
    </header>
  );
}

export function LotusDivider({ className = "mt-4" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center justify-center gap-3 text-accent ${className}`}>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--accent)]" />
      <svg viewBox="0 0 32 20" className="h-4 w-6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
        <path d="M16 2c2.4 2.8 2.4 7.6 0 11-2.4-3.4-2.4-8.2 0-11Z" />
        <path d="M16 13c-1.8-3.4-5.4-5.4-9-5 .2 3.8 3.6 6 9 5Zm0 0c1.8-3.4 5.4-5.4 9-5-.2 3.8-3.6 6-9 5Z" />
        <path d="M8 17h16" />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--accent)]" />
    </div>
  );
}
