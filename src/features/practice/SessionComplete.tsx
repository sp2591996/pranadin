"use client";

/** P5 Session complete: calm and brief; never a streak loss or stats wall (DS-5 §3, FR-6.4). */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/client";
import { readLocal, todayKey, writeLocal } from "@/features/shared/device";
import { useS } from "@/features/shared/strings";
import { useDeviceValue } from "@/features/shared/use-device";
import { btn, card } from "@/features/shared/ui";
import { ReminderPanel } from "@/features/reminder/ReminderPanel";
import { routes } from "@/lib/routes";
import { WeekDots } from "./ProgressCard";
import { practiceRoutes } from "./routes";
import { loadProgress } from "./store";
import type { Progress } from "./streak";

const OFFER_KEY = "reminder.offered.v1";

export function SessionComplete({ kind, minutes, saved }: { kind: "breath" | "stillness"; minutes: number; saved: boolean }) {
  const s = useS();
  const { locale } = useI18n();
  const heading = useRef<HTMLHeadingElement>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [offer, setOffer] = useDeviceValue(() => !readLocal<boolean>(OFFER_KEY, false), false);
  const [msgN] = useState(() => 1 + Math.floor(Math.random() * 5));

  useEffect(() => {
    heading.current?.focus();
    void loadProgress().then(setProgress);
  }, []);

  // US-35: offer the reminder once, after the first completed practice.
  useEffect(() => {
    if (offer) writeLocal(OFFER_KEY, true);
  }, [offer]);

  return (
    <section aria-labelledby="done-h" className="flex flex-col items-center gap-4 py-6 text-center">
      <h1 id="done-h" ref={heading} tabIndex={-1} className="text-[2.25rem] leading-[2.75rem] focus:outline-none">
        {s("complete.title")}
      </h1>
      <p className="text-[1.125rem] leading-7">{s("complete.summary", { minutes, type: s(`complete.type.${kind}`) })}</p>
      <p className="text-text-muted">{s(`complete.msg.${msgN}`)}</p>
      {!saved ? <p className="rounded-md bg-warning-tint p-3 text-text">{s("practice.notSaved")}</p> : null}
      {progress ? (
        <div className="w-full max-w-sm">
          <WeekDots progress={progress} today={todayKey()} />
        </div>
      ) : null}
      <div className="mt-2 flex w-full max-w-sm flex-col gap-3">
        <Link href={practiceRoutes.journalNew(locale)} className={btn.primary}>
          {s("complete.addReflection")}
        </Link>
        <Link href={routes.today(locale)} className={btn.ghost}>
          {s("complete.doneForNow")}
        </Link>
      </div>
      {offer ? (
        <aside aria-labelledby="offer-h" className={`${card} mt-4 w-full max-w-sm text-left`}>
          <h2 id="offer-h" className="mb-2 text-[1.125rem] leading-[1.625rem]">
            {s("reminder.offer.title")}
          </h2>
          <ReminderPanel showRemoveHelp={false} />
          <button type="button" className={`${btn.ghost} mt-2`} onClick={() => setOffer(false)}>
            {s("common.notNow")}
          </button>
        </aside>
      ) : null}
    </section>
  );
}
