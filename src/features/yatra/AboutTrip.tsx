"use client";

import { useS } from "@/features/shared/strings";
import { btn } from "@/features/shared/ui";
import { PlannerIcon } from "./PlannerIcon";
import { COVERS, STYLES } from "./trip-compute";
import type { Cover, Style } from "./trip-engine";
import type { CityView } from "./types";

/** Home town, what to cover and travel style (D-038). */
export function AboutTrip({
  cities,
  home,
  cover,
  style,
  onChange,
}: {
  cities: CityView[];
  home: string;
  cover: Cover;
  style: Style;
  onChange: (patch: { home?: string; cover?: Cover; style?: Style }) => void;
}) {
  const s = useS();
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 font-semibold">
          <PlannerIcon name="House" size={18} className="text-primary" />
          {s("yatra.planner.home")}
        </span>
        <select
          value={home}
          onChange={(e) => onChange({ home: e.target.value })}
          className="min-h-12 rounded-xl border border-border-input bg-surface px-3"
        >
          <option value="">{s("yatra.planner.homePick")}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id} lang={c.name.lang}>
              {c.name.text}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="mb-1 font-semibold">{s("yatra.planner.cover")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {COVERS.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cover === c}
              onClick={() => onChange({ cover: c })}
              className={`flex min-h-11 items-start gap-2 rounded-xl border-2 p-3 text-left ${
                cover === c ? "border-primary bg-primary-tint text-on-primary-tint" : "border-divider bg-surface hover:border-primary"
              }`}
            >
              <PlannerIcon name={c === "darshan" ? "HandsPraying" : "Mountains"} size={20} className="mt-0.5 shrink-0" />
              <span>
                <span className="block font-semibold">{s(`yatra.planner.cover.${c}`)}</span>
                <span className="block text-small">{s(`yatra.planner.cover.${c}Sub`)}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <p className="mb-1 font-semibold" id="pl-style">
          {s("yatra.planner.style")}
        </p>
        <div role="group" aria-labelledby="pl-style" className="flex flex-wrap gap-2">
          {STYLES.map((st) => (
            <button key={st} type="button" className={btn.chip} aria-pressed={style === st} onClick={() => onChange({ style: st })}>
              <PlannerIcon name={st === "cheap" ? "PiggyBank" : st === "fast" ? "Lightning" : "Scales"} size={16} />
              {s(`yatra.planner.style.${st}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
