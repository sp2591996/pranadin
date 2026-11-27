import { TRAVEL_PATHS, type TravelIconName } from "./travel-icons.generated";

/** Travel icons (Phosphor, regular weight) used only on Yatra pages (D-037). Decorative. */
export function TravelIcon({ name, size = 24, className }: { name: TravelIconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      {TRAVEL_PATHS[name].regular.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
