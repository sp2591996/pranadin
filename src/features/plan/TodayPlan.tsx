"use client";

/** Today's 3-step plan (FR-3.2, US-08/09/17, QA-01). Placed on Today by Dev-1 via `<TodayPlanSlot/>`. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { useI18n } from "@/i18n/client";
import { track } from "@/features/analytics";
import { practiceRoutes } from "@/features/practice/routes";
import { practiceDays } from "@/features/practice/streak";
import { readLocal, todayKey, writeLocal } from "@/features/shared/device";
import { useS } from "@/features/shared/strings";
import { btn, card } from "@/features/shared/ui";
import { getPrefs, getStorage } from "@/lib/storage";
import type { Locale } from "@/lib/types";
import { buildPlan, doneToday, needsWelcomeBack, slugOf, type PlanContent, type PlanStep, type StepType } from "./plan";

interface State {
  today: string;
  steps: PlanStep[];
  done: StepType[];
  welcomeBack: boolean;
  first: boolean;
}

const PLAN_DONE_KEY = "plan.completedOn.v1";

export function stepHref(locale: Locale, s: PlanStep): string {
  const q = `?min=${s.minutes}&src=plan`;
  if (s.type === "breath" && s.card.practiceId) return `${practiceRoutes.breath(locale, slugOf(s.card.practiceId))}${q}`;
  if (s.type === "stillness" && s.card.practiceId) return `${practiceRoutes.stillness(locale, slugOf(s.card.practiceId))}${q}`;
  return `/${locale}/journal/?new=1&src=plan${s.card.promptId ? `&prompt=${encodeURIComponent(s.card.promptId)}` : ""}`;
}

async function compute(content: PlanContent): Promise<State> {
  const today = todayKey();
  const prefs = getPrefs().read();
  try {
    const st = await getStorage();
    const [logs, entries] = await Promise.all([st.practiceLog.list(), st.journal.list({ fromDate: today })]);
    const days = practiceDays(logs);
    const welcomeBack = needsWelcomeBack(days, today);
    const steps = buildPlan(content, prefs.goal, prefs.minutes, today, welcomeBack);
    return { today, steps, done: [...doneToday(logs, entries, today)], welcomeBack, first: days.size === 0 };
  } catch {
    return { today, steps: buildPlan(content, prefs.goal, prefs.minutes, today), done: [], welcomeBack: false, first: true };
  }
}

export function TodayPlan({ content }: { content: PlanContent }) {
  const s = useS();
  const { locale } = useI18n();
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    let alive = true;
    const update = () =>
      void compute(content).then((st) => {
        if (alive) setState(st);
      });
    update();
    const onVis = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [content]);

  const allDone = !!state && state.steps.length > 0 && state.steps.every((st) => state.done.includes(st.type));

  // PRD §10: daily_plan_completed, once per day.
  useEffect(() => {
    if (!allDone || !state || state.welcomeBack) return;
    if (readLocal<string | null>(PLAN_DONE_KEY, null) === state.today) return;
    writeLocal(PLAN_DONE_KEY, state.today);
    track("daily_plan_completed", { minutes: getPrefs().read().minutes });
  }, [allDone, state]);

  if (!state) return <div aria-busy="true" className="min-h-[280px]" />;

  const total = state.steps.reduce((a, st) => a + st.minutes, 0);
  const next = state.steps.find((st) => !state.done.includes(st.type));

  return (
    <section aria-labelledby="plan-h" className={`${card} flex flex-col gap-4`}>
      <div>
        <h2 id="plan-h">{state.welcomeBack ? s("today.welcomeBack.title") : s("today.plan.title")}</h2>
        <p className="text-text-muted">
          {state.welcomeBack
            ? s("today.welcomeBack.body")
            : state.first
              ? s("today.first")
              : s("today.plan.summary", { steps: state.steps.length, minutes: total })}
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {state.steps.map((st) => {
          const done = state.done.includes(st.type);
          return (
            <li key={st.n}>
              <Link
                href={stepHref(locale, st)}
                className="flex min-h-14 items-start gap-3 rounded-md border border-divider bg-bg p-3 hover:bg-surface-2"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.875rem] font-semibold ${done ? "bg-success-tint text-success" : "bg-primary-tint text-on-primary-tint"}`}
                >
                  {done ? <CheckCircleIcon size={20} weight="fill" /> : st.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.875rem] leading-5 text-text-muted">
                    {s(`step.${st.type}`)} · {s("common.minutesShort", { count: st.minutes })}
                    {done ? ` · ${s("step.done")}` : ""}
                  </span>
                  <span className="block font-semibold">{st.card.title}</span>
                  <span className="block text-[0.875rem] leading-5 text-text-muted">{st.card.body}</span>
                  <span className="sr-only">{done ? s("a11y.stepDone") : s("a11y.stepNotDone")}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {allDone ? (
        <div role="status">
          <p className="font-semibold">{s("today.plan.allDone")}</p>
          <p className="text-text-muted">{s("today.plan.allDoneSub")}</p>
        </div>
      ) : next ? (
        <Link href={stepHref(locale, next)} className={`${btn.primary} w-full`}>
          {next.n === 1 || !state.steps.some((x) => state.done.includes(x.type))
            ? s("today.plan.begin", { n: next.n, minutes: next.minutes })
            : s("today.plan.continue", { n: next.n })}
        </Link>
      ) : null}
    </section>
  );
}
