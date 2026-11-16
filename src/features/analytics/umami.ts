/**
 * Umami Cloud adapter (L5 approved list: free tier, cookieless). Loaded only
 * by `index.ts` after consent, in production, when configured. Sends one
 * small JSON POST per event; no script tag, no autocapture, no cookies,
 * no referrer, no page URL beyond the path without query string.
 */
import type { AnalyticsAdapter } from "./index";

export function createUmamiAdapter(): AnalyticsAdapter {
  const website = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const host = (process.env.NEXT_PUBLIC_UMAMI_HOST ?? "https://cloud.umami.is").replace(/\/$/, "");
  if (!website) return { send() {} };
  return {
    send(name, payload) {
      const body = JSON.stringify({
        type: "event",
        payload: {
          website,
          hostname: location.hostname,
          language: String(payload.lang ?? ""),
          url: location.pathname, // never the query string (L5 3.6)
          name,
          data: payload,
        },
      });
      void fetch(`${host}/api/send`, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        referrerPolicy: "no-referrer",
        keepalive: true,
      }).catch(() => {});
    },
  };
}
