import { ICON_PATHS, type IconName } from "./icons.generated";

/**
 * Phosphor icon (regular / fill) as inline SVG. Decorative by default
 * (aria-hidden); give the parent control an accessible name.
 */
export function Icon({ name, size = 24, weight = "regular" }: { name: IconName; size?: number; weight?: "regular" | "fill" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name][weight].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
