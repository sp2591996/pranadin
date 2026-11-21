/**
 * Lotus motif for one chakra (pure SVG, no image request). Petal count follows
 * the tradition, capped at 24 so the thousand-petalled lotus stays legible.
 * The chakra's colour is decoration only; the number and names carry meaning.
 */
export function ChakraMotif({ n, petals, hex, label, className = "" }: { n: number; petals: number; hex: string; label?: string; className?: string }) {
  const count = Math.min(petals, 24);
  const step = 360 / count;
  const d = count > 12 ? "M0 -50 C6 -40 6 -30 0 -22 C-6 -30 -6 -40 0 -50Z" : "M0 -50 C14 -40 14 -26 0 -16 C-14 -26 -14 -40 0 -50Z";
  return (
    <svg
      viewBox="-60 -60 120 120"
      className={`select-none ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <circle r="56" fill={hex} fillOpacity="0.12" stroke={hex} strokeWidth="1.5" strokeDasharray="1 5" strokeLinecap="round" />
      {Array.from({ length: count }, (_, i) => (
        <path key={i} d={d} transform={`rotate(${i * step})`} fill={hex} fillOpacity="0.35" stroke={hex} strokeWidth="1.5" />
      ))}
      <circle r="14" fill={hex} />
      <text y="5" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" stroke="#000" strokeOpacity="0.35" strokeWidth="0.6" paintOrder="stroke">
        {n}
      </text>
    </svg>
  );
}
