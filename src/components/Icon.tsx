import { ICON_PATHS, type IconName } from "./icons.generated";

/**
 * Phosphor icon (regular / fill) as inline SVG. Decorative by default
 * (aria-hidden); give the parent control an accessible name. Icons generated
 * with only the regular weight fall back to it when "fill" is asked for.
 */
export function Icon({ name, size = 24, weight = "regular", className }: { name: IconName; size?: number; weight?: "regular" | "fill"; className?: string }) {
  const set = ICON_PATHS[name] as Record<string, readonly string[]>;
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      {(set[weight] ?? set.regular ?? []).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
