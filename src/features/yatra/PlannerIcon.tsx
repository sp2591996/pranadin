import { PLANNER_PATHS, type PlannerIconName } from "./planner-icons.generated";

/** Phosphor icons (regular weight) for the trip planner only (D-037). Decorative. */
export function PlannerIcon({ name, size = 24, className }: { name: PlannerIconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      {PLANNER_PATHS[name].regular.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
