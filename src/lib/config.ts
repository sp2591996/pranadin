/**
 * Operator-supplied values. One place, so filling them in is a one-line change.
 *
 * FEEDBACK_URL: the feedback/contact link (US-27). The Board has not supplied
 * it yet (D-022). While it is null, every "Send feedback" entry is hidden and
 * page sentences that point to it are removed, so the app never promises a
 * channel that doesn't exist. Use an https:// or mailto: URL.
 */
export const FEEDBACK_URL: string | null = "mailto:sachin@gmail.com?subject=PranaDin%20feedback";
