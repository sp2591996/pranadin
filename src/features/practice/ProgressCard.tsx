"use client";

/** Gentle streak + week dots (FR-6, US-16/17). Never says lost, broke or failed. */
import { useS } from "@/features/shared/strings";
import { card } from "@/features/shared/ui";
import type { Progress } from "./streak";

const DAY_KEYS = ["week.mon", "week.tue", "week.wed", "week.thu", "week.fri", "week.sat", "week.sun"];

export function WeekDots({ progress, today }: { progress: Progress; today?: string }) {
  const s = useS();
  return (
    <ol className="grid grid-cols-7 gap-1" aria-label={s("progress.week")}>
      {progress.weekDates.map((d, i) => {
        const on = progress.weekDots[i];
        return (
          <li key={d} className="flex flex-col items-center gap-1">
            <span
              aria-hidden="true"
              className={`h-4 w-4 rounded-full border-2 ${on ? "border-primary bg-primary" : "border-border-input"} ${d === today ? "outline-2 outline-offset-2 outline-primary" : ""}`}
            />
            <span className="text-[0.75rem] leading-4 text-text-muted">{s(DAY_KEYS[i]!)}</span>
            <span className="sr-only">{on ? s("a11y.stepDone") : s("a11y.stepNotDone")}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressCard({ progress, today }: { progress: Progress; today: string }) {
  const s = useS();
  let line: string;
  if (progress.state === "grace") line = s("streak.graceUsed", { count: progress.streak });
  else if (progress.state === "reset") line = s("streak.reset");
  else line = s("streak.grace");
  return (
    <section aria-labelledby="progress-h" className={card}>
      <h2 id="progress-h" className="sr-only">
        {s("progress.title")}
      </h2>
      <p className="text-[1.375rem] leading-[1.875rem] font-semibold">{s("streak.count", { count: progress.streak })}</p>
      <p className="mt-1 text-text-muted">{line}</p>
      <div className="mt-4">
        <WeekDots progress={progress} today={today} />
      </div>
      <p className="mt-4 text-[0.875rem] leading-5 text-text-muted">
        {s("streak.totalDays", { count: progress.totalDays })} · {s("streak.totalMinutes", { count: progress.totalMinutes })}
      </p>
    </section>
  );
}
