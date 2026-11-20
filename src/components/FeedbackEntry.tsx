"use client";

import { useI18n } from "@/i18n/client";
import { FEEDBACK_URL } from "@/lib/config";

/**
 * "Send feedback" row for Me (US-27, QA-05). Uses the single config value
 * `FEEDBACK_URL` (src/lib/config.ts). Renders nothing until the Board supplies
 * a contact (D-022), so no placeholder ever shows. Drop it into a list as a
 * `<li>`: `<FeedbackEntry className="flex min-h-14 items-center px-4" />`.
 */
export function FeedbackEntry({ className = "flex min-h-14 items-center px-4" }: { className?: string }) {
  const { t } = useI18n();
  if (!FEEDBACK_URL) return null;
  const external = FEEDBACK_URL.startsWith("https://");
  return (
    <li>
      <a href={FEEDBACK_URL} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {t("me.feedback")}
        {external && <span className="sr-only"> ({t("a11y.opensOutside")})</span>}
      </a>
    </li>
  );
}
