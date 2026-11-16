"use client";

/** "Add a daily reminder to my calendar" (US-35, CR-01). Strings: `reminder.*`. */
import { useId, useState } from "react";
import { CalendarPlusIcon } from "@phosphor-icons/react/dist/csr/CalendarPlus";
import { useI18n } from "@/i18n/client";
import { downloadText, userTimeZone } from "@/features/shared/device";
import { useS } from "@/features/shared/strings";
import { useDeviceValue } from "@/features/shared/use-device";
import { btn, Status } from "@/features/shared/ui";
import { routes } from "@/lib/routes";
import { getPrefs, newId } from "@/lib/storage";
import { buildDailyIcs } from "./ics";

export function defaultReminderTime(): string {
  const p = getPrefs().read();
  if (p.reminderTime) return p.reminderTime;
  return p.slot === "evening" ? "19:00" : "07:00";
}

export function ReminderPanel({ showRemoveHelp = true }: { showRemoveHelp?: boolean }) {
  const s = useS();
  const { locale } = useI18n();
  const id = useId();
  const [time, setTime] = useDeviceValue(defaultReminderTime, "07:00");
  const [status, setStatus] = useState<string | null>(null);

  const add = () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return;
    getPrefs().write({ reminderTime: time });
    // Link back to Today: origin + locale path only, no personal ID (FR-13.2).
    const url = `${window.location.origin}${routes.today(locale)}`;
    const ics = buildDailyIcs({
      time,
      timeZone: userTimeZone(),
      title: s("reminder.ics.title"),
      description: s("reminder.ics.desc", { link: url }),
      url,
      now: new Date(),
      uid: `${newId()}@pranadin`,
    });
    downloadText("pranadin-daily-reminder.ics", "text/calendar", ics);
    setStatus(s("reminder.added"));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-text-muted">{s("reminder.cr01.explainer", { time })}</p>
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor={id} className="flex flex-col gap-1">
          <span className="text-[14px] leading-5 font-semibold">{s("reminder.time")}</span>
          <input
            id={id}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="min-h-12 rounded-md border border-border-input bg-surface px-3 text-text"
          />
        </label>
        <button type="button" className={btn.primary} onClick={add}>
          <CalendarPlusIcon size={20} aria-hidden="true" />
          {s("reminder.cr01.button")}
        </button>
      </div>
      <Status message={status} />
      {showRemoveHelp ? <p className="text-[14px] leading-5 text-text-muted">{s("reminder.howToRemove")}</p> : null}
    </div>
  );
}
