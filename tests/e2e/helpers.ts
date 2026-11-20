import { expect, type Page, type Request } from "@playwright/test";

export const LOCALES = ["en", "hi", "mr"] as const;
export type Lang = (typeof LOCALES)[number];
export const NATIVE: Record<Lang, string> = { en: "English", hi: "हिन्दी", mr: "मराठी" };

/** P0 screens reachable by URL once onboarding is done. */
export const P0_PAGES = [
  "today/",
  "practice/",
  "practice/breath/sama-vritti/",
  "practice/stillness/silent/",
  "calendar/",
  "journal/",
  "settings/",
  "info/privacy/",
  "info/terms/",
  "info/disclaimer/",
  "info/help/",
  "info/sources/",
  "info/about/",
] as const;

/** Old product names that must never appear (D-021). */
export const BANNED_NAMES = /PranaPath|Antaryatra|प्राणपथ|अंतर्यात्रा|अन्तर्यात्रा/i;

/** A UI message key rendered raw, e.g. `today.title` (US-02). Domains are excluded by the namespace list. */
export const RAW_KEY =
  /\b(?:today|practice|cal|calendar|journal|me|onb|common|lang|nav|trust|settings|plan|mood|reminder|streak|stillness|breath|app|a11y|err|info)\.[a-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)*\b/;

/** Breath retention must never be instructed (content red line, C4). */
export const BREATH_HOLD = /\bhold (?:your|the) breath for\b|\bHold\s*[·:]?\s*\d|kumbhak|कुंभक/i;

/** Primary button of the current onboarding step (works in every language). */
const primary = (page: Page) => page.locator("section button.bg-primary").first();

/** Clicks the step's primary button and waits for the next step's heading. */
export async function nextStep(page: Page): Promise<void> {
  const heading = page.locator("section h2").first();
  const before = await heading.innerText();
  await primary(page).click();
  await expect(heading).not.toHaveText(before);
}

/**
 * Completes onboarding in `lang` by taking the primary option on every step.
 * Leaves the page on Today.
 */
export async function onboard(page: Page, lang: Lang = "en"): Promise<void> {
  await page.goto("/");
  await page.waitForURL(/\/onboarding\//);
  await page.getByRole("radio", { name: NATIVE[lang] }).click();
  await page.waitForURL(new RegExp(`/${lang}/onboarding/`));
  await expect(page.locator("html")).toHaveAttribute("lang", lang);
  // [language (Continue)], welcome (I understand), goal, time, city (Continue
  // finishes). Picking a different language reloads straight onto Welcome.
  await expect(page.locator("section h2").first()).toBeVisible();
  for (let i = 0; i < 4 && (await primary(page).count()) > 0; i++) {
    await nextStep(page);
  }
  await primary(page).click();
  await page.waitForURL(new RegExp(`/${lang}/today/`));
}

/** Records every request whose origin is not the app's own. */
export function trackThirdParty(page: Page, baseURL: string): string[] {
  const origin = new URL(baseURL).origin;
  const seen: string[] = [];
  page.on("request", (r: Request) => {
    const u = r.url();
    if (!u.startsWith(origin) && !u.startsWith("data:") && !u.startsWith("blob:")) seen.push(u);
  });
  return seen;
}

export async function expectCleanText(page: Page): Promise<void> {
  const text = await page.locator("body").innerText();
  expect(text, "raw i18n key visible").not.toMatch(RAW_KEY);
  expect(text, "old product name visible").not.toMatch(BANNED_NAMES);
  expect(await page.title()).not.toMatch(BANNED_NAMES);
  expect(text, "breath-hold instruction visible").not.toMatch(BREATH_HOLD);
}

/** Fires a visibilitychange to "hidden" and back, like locking the phone. */
export async function simulateBackground(page: Page): Promise<void> {
  const set = (hidden: boolean) =>
    page.evaluate((h) => {
      Object.defineProperty(document, "visibilityState", { value: h ? "hidden" : "visible", configurable: true });
      Object.defineProperty(document, "hidden", { value: h, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
  await set(true);
  await page.waitForTimeout(300);
  await set(false);
}
