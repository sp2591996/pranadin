import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { LOCALES, onboard, P0_PAGES } from "./helpers";

/** US-29 / DS-7 / Go-No-Go D1: axe on every P0 screen, light and dark, 0 serious or critical. */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
/** Known open defects, excluded here so new regressions still fail. Remove when fixed. */
const KNOWN: Record<string, string[]> = { "info/privacy/": ["scrollable-region-focusable"] /* QA-14 */ };

for (const lang of LOCALES) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`axe: ${lang} ${colorScheme}`, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext({ baseURL, colorScheme, locale: `${lang}-IN`, viewport: { width: 360, height: 780 } });
      const page = await ctx.newPage();
      await onboard(page, lang);
      const pages = ["onboarding/", ...P0_PAGES];
      const failures: string[] = [];
      for (const p of pages) {
        await page.goto(`/${lang}/${p}`);
        await page.locator("main").waitFor();
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        for (const v of violations) {
          if ((v.impact === "serious" || v.impact === "critical") && !(KNOWN[p] ?? []).includes(v.id)) {
            failures.push(`${p} ${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0]?.target.join(" ")}`);
          }
        }
      }
      expect(failures).toEqual([]);
      await ctx.close();
    });
  }
}

test("axe: privacy page table is keyboard-scrollable [QA-14]", async ({ page }) => {
  test.fail(true, "QA-14: scrollable-region-focusable on /info/privacy/");
  await onboard(page, "en");
  await page.goto("/en/info/privacy/");
  const { violations } = await new AxeBuilder({ page }).withRules(["scrollable-region-focusable"]).analyze();
  expect(violations).toEqual([]);
});

test.describe("DS-7 layout checks", () => {
  test.beforeEach(async ({ page }) => onboard(page, "en"));

  test("no visible text below 12 px (14 px for Devanagari) on P0 screens", async ({ page }) => {
    for (const lang of LOCALES) {
      for (const p of P0_PAGES) {
        await page.goto(`/${lang}/${p}`);
        const small = await page.evaluate(() => {
          const out: string[] = [];
          const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let n: Node | null;
          while ((n = w.nextNode())) {
            const t = n.textContent?.trim();
            const el = n.parentElement;
            if (!t || !el || el.closest("[aria-hidden=true], .sr-only")) continue;
            const cs = getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden" || !el.getBoundingClientRect().width) continue;
            const fs = parseFloat(cs.fontSize);
            if (fs < 12 || (/[ऀ-ॿ]/.test(t) && fs < 14)) out.push(`${fs}px ${t.slice(0, 30)}`);
          }
          return out;
        });
        expect(small, `${lang}/${p}`).toEqual([]);
      }
    }
  });

  test("tap targets of controls are at least 44 x 44 px on tab screens", async ({ page }) => {
    for (const p of ["today/", "practice/", "practice/breath/sama-vritti/", "journal/", "settings/"]) {
      await page.goto(`/en/${p}`);
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("main a, main button, main select, main textarea, nav a, header a, header button")]
          .filter((e) => !e.closest(".sr-only") && getComputedStyle(e).display !== "inline")
          .map((e) => ({ e, r: e.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.width < 44 || r.height < 44))
          .map(({ e, r }) => `${e.tagName} ${Math.round(r.width)}x${Math.round(r.height)} ${(e.getAttribute("aria-label") ?? e.innerText).trim().slice(0, 30)}`),
      );
      expect(small, p).toEqual([]);
    }
  });

  test("320 px reflow: no sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    for (const p of ["onboarding/", ...["today/", "practice/", "practice/breath/sama-vritti/", "practice/stillness/silent/", "journal/", "settings/"]]) {
      await page.goto(`/en/${p}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), p).toBeLessThanOrEqual(0);
    }
  });

  test("200% text: bottom nav labels stay inside the screen [QA-07]", async ({ page }) => {
    test.fail(true, "QA-07: nav labels overlap and Journal is cut off at 200% text");
    await page.goto("/en/today/");
    await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
    const out = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("nav a")].filter((a) => a.getBoundingClientRect().right > innerWidth + 1).map((a) => a.innerText),
    );
    expect(out).toEqual([]);
  });
});
