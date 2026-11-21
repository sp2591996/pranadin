"use client";

import { useState } from "react";
import { useS } from "@/features/shared/strings";
import { useDeviceValue } from "@/features/shared/use-device";
import { btn, card } from "@/features/shared/ui";
import { ackSafety, hasAckedSafety } from "./store";

const POINTS = ["yoga.safety.1", "yoga.safety.2", "yoga.safety.3", "yoga.safety.4"] as const;

/** Short, always-visible reminder. */
export function SafetyList() {
  const s = useS();
  return (
    <ul className="list-disc space-y-1 ps-5 text-text">
      {POINTS.map((k) => (
        <li key={k}>{s(k)}</li>
      ))}
    </ul>
  );
}

/**
 * Safety notice before the first yoga session. Children render only after the
 * visitor has tapped "I understand" (stored on the device); afterwards it is
 * a one-line reminder above the content.
 */
export function SafetyGate({ children }: { children: React.ReactNode }) {
  const s = useS();
  const [acked, setAcked] = useDeviceValue(hasAckedSafety, true);
  const [open, setOpen] = useState(false);
  if (!acked) {
    return (
      <section aria-labelledby="yoga-safety-h" className={`${card} flex flex-col gap-3`}>
        <h2 id="yoga-safety-h">{s("yoga.safety.title")}</h2>
        <SafetyList />
        <button
          type="button"
          className={`${btn.primary} self-start`}
          onClick={() => {
            ackSafety();
            setAcked(true);
          }}
        >
          {s("yoga.safety.ack")}
        </button>
      </section>
    );
  }
  return (
    <>
      <p className="text-[0.875rem] leading-5 text-text-muted">
        {s("yoga.safety.short")}{" "}
        <button type="button" className="inline-flex min-h-11 items-center underline underline-offset-2" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {s("yoga.safety.link")}
        </button>
      </p>
      {open ? (
        <div className={card}>
          <SafetyList />
        </div>
      ) : null}
      {children}
    </>
  );
}
