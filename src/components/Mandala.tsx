/**
 * Decorative rangoli / mandala motif (D-029). Pure inline SVG, no image request.
 * Drawn in currentColor so it follows the theme; hidden from assistive tech.
 */
export function Mandala({ className = "" }: { className?: string }) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  const dots = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="-100 -100 200 200"
      className={`pointer-events-none select-none ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle r="96" strokeDasharray="1 6" strokeLinecap="round" strokeWidth="3" />
      {dots.map((a) => (
        <circle key={a} r="2.2" cx="0" cy="-82" fill="currentColor" stroke="none" transform={`rotate(${a})`} />
      ))}
      {petals.map((a) => (
        <path key={a} d="M0 -72 C14 -56 14 -38 0 -26 C-14 -38 -14 -56 0 -72Z" transform={`rotate(${a})`} />
      ))}
      {petals.map((a) => (
        <path key={`s${a}`} d="M0 -24 L6 -14 L0 -8 L-6 -14Z" transform={`rotate(${a + 15})`} />
      ))}
      <circle r="12" />
      <circle r="5" fill="currentColor" stroke="none" />
    </svg>
  );
}
