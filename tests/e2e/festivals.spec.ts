import { expect, test } from "@playwright/test";
import { LOCALES, onboard } from "./helpers";

const ALLOW = ["PranaDin", "Beta", "Drik Panchang", "Hindu Blog", "Catholic Church Times", "Lion's Roar", "Guru Granth Sahib", "Government of India"];
/** Same rule as no-english.spec.ts: 3 or more consecutive English words. */
function englishRun(text: string): string | null {
  let t = text;
  for (const a of ALLOW) t = t.split(a).join(" | ");
  let run: string[] = [];
  for (const tok of [...t.split(/\s+/).filter(Boolean), "|"]) {
    if (/^[A-Za-z][A-Za-z'’-]*[,.;:!?]?$/.test(tok)) {
      run.push(tok);
      if (run.length >= 3) return run.join(" ");
    } else run = [];
  }
  return null;
}

test.describe("Festivals guide", () => {
  test("list to detail, with filters, in English", async ({ page }) => {
    await onboard(page, "en");
    await page.goto("/en/calendar/");
    await page.getByRole("link", { name: /Festival guide/i }).first().click();
    await expect(page).toHaveURL(/\/en\/calendar\/festivals\/$/);
    const cards = page.locator("main li a[href*='/calendar/festivals/']");
    const all = await cards.count();
    expect(all).toBe(24);
    await page.getByRole("button", { name: /^Sikh$/i }).click();
    expect(await cards.count()).toBeLessThan(all);
    await page.getByRole("button", { name: /^(All|All traditions)$/i }).first().click();
    await page.goto("/en/calendar/festivals/diwali/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("section[aria-labelledby='fs-steps'] ol li").first()).toBeVisible();
    expect(await page.locator("section[aria-labelledby='fs-steps'] ol li").count()).toBeGreaterThanOrEqual(5);
    await expect(page.locator("section[aria-labelledby='fs-sources'] a").first()).toHaveAttribute("href", /^https:/);
    await expect(page.getByTestId("next-date")).toBeVisible();
  });

  test("Today and Calendar observance cards link to the guide", async ({ page }) => {
    await onboard(page, "en");
    // 24 Nov 2026 is Guru Nanak Gurpurab, which has a guide entry.
    await page.clock.setFixedTime(new Date("2026-11-24T10:00:00"));
    for (const p of ["/en/today/", "/en/calendar/"]) {
      await page.goto(p);
      const link = page.getByRole("link", { name: /Read the story and how to celebrate/i }).first();
      await expect(link, p).toHaveAttribute("href", "/en/calendar/festivals/guru-nanak-jayanti/");
      await link.click();
      await expect(page).toHaveURL(/\/en\/calendar\/festivals\/guru-nanak-jayanti\/$/);
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  for (const lang of LOCALES.filter((l) => l !== "en")) {
    test(`${lang} list and detail have no English runs`, async ({ page }) => {
      await onboard(page, lang);
      for (const p of ["calendar/festivals/", "calendar/festivals/diwali/", "calendar/festivals/onam/"]) {
        await page.goto(`/${lang}/${p}`);
        await expect(page.locator("h1")).toBeVisible();
        const text = await page.evaluate(() => {
          const out: string[] = [];
          const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          for (let n = w.nextNode(); n; n = w.nextNode()) {
            const el = n.parentElement;
            if (!el || el.closest("script,style,noscript,[hidden],[aria-hidden='true']")) continue;
            const l = el.closest("[lang]")?.getAttribute("lang");
            if (l === "en" || l?.endsWith("-Latn")) continue;
            out.push(n.textContent ?? "");
          }
          return out.join(" ");
        });
        expect(englishRun(text), `${lang}/${p}`).toBeNull();
      }
    });
  }
});
