/**
 * Small line-art marks for icon tiles (D-033). Inline SVG in currentColor,
 * decorative only (aria-hidden), so they add no request and follow the theme.
 */
const base = { "aria-hidden": true, focusable: false, viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export type OrnamentName = "lotus" | "chakra" | "diya" | "temple" | "mala" | "breath" | "book" | "sun";

export function Ornament({ name, className = "h-6 w-6" }: { name: OrnamentName; className?: string }) {
  switch (name) {
    case "lotus":
      return (
        <svg {...base} className={className}>
          <path d="M16 6c3 3.5 3 9 0 13-3-4-3-9.5 0-13Z" />
          <path d="M16 19c-2-4-6-6.5-10-6 0 4.5 4 7.5 10 6Zm0 0c2-4 6-6.5 10-6 0 4.5-4 7.5-10 6Z" />
          <path d="M7 24h18" />
        </svg>
      );
    case "chakra":
      return (
        <svg {...base} className={className}>
          <circle cx="16" cy="16" r="10" />
          <circle cx="16" cy="16" r="3" />
          {[0, 45, 90, 135].map((a) => (
            <path key={a} d="M16 6v20" transform={`rotate(${a} 16 16)`} />
          ))}
        </svg>
      );
    case "diya":
      return (
        <svg {...base} className={className}>
          <path d="M16 5c2 2.5 2.5 4.5 0 7-2.5-2.5-2-4.5 0-7Z" />
          <path d="M5 17h22c-1 5-5.5 8-11 8S6 22 5 17Z" />
          <path d="M12 25l-1 2h10l-1-2" />
        </svg>
      );
    case "temple":
      return (
        <svg {...base} className={className}>
          <path d="M16 3v3M11 13c0-4 2.5-6.5 5-7 2.5.5 5 3 5 7" />
          <path d="M8 13h16M9 13v14M23 13v14M5 27h22" />
          <path d="M13 27v-6a3 3 0 0 1 6 0v6" />
        </svg>
      );
    case "mala":
      return (
        <svg {...base} className={className}>
          <circle cx="16" cy="14" r="9" strokeDasharray="0.1 3.4" strokeWidth="2.6" />
          <path d="M16 23v3m-2 0h4l-2 3-2-3Z" />
        </svg>
      );
    case "breath":
      return (
        <svg {...base} className={className}>
          <path d="M4 12h15a3.5 3.5 0 1 0-3.5-3.5M4 17h20a3.5 3.5 0 1 1-3.5 3.5M4 22h9" />
        </svg>
      );
    case "book":
      return (
        <svg {...base} className={className}>
          <path d="M16 9c-3-2-7-2.5-11-2v17c4-.5 8 0 11 2 3-2 7-2.5 11-2V7c-4-.5-8 0-11 2Zm0 0v17" />
        </svg>
      );
    case "sun":
      return (
        <svg {...base} className={className}>
          <circle cx="16" cy="16" r="5" />
          <path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2 2M22.5 22.5l2 2M24.5 7.5l-2 2M9.5 22.5l-2 2" />
        </svg>
      );
  }
}

/** Icon tile used on feature cards: saffron mark on a soft saffron square. */
export function IconTile({ name, className = "" }: { name: OrnamentName; className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-primary ${className}`}>
      <Ornament name={name} className="h-7 w-7" />
    </span>
  );
}

/** ॐ between two hairlines: a section divider. */
export function OmDivider({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-3 text-accent ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--accent)] opacity-60" />
      <span className="font-deva text-lg leading-none">ॐ</span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--accent)] opacity-60" />
    </div>
  );
}
