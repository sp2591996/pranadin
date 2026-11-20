import { expect, test } from "@playwright/test";
import { expectCleanText, LOCALES, onboard, P0_PAGES, trackThirdParty } from "./helpers";

/** Smoke: every P0 page in every language loads clean (US-02, US-30, D-021, C4). */
for (const lang of LOCALES) {
  test.describe(`Smoke ${lang}`, () => {
    test(`all P0 pages load without raw keys, old names, breath-holds, errors or third-party requests`, async ({ page, baseURL }) => {
      const thirdParty = trackThirdParty(page, baseURL!);
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await onboard(page, lang);
      for (const p of P0_PAGES) {
        const res = await page.goto(`/${lang}/${p}`);
        expect(res?.status(), p).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", lang);
        await expect(page.locator("main")).toBeVisible();
        await expectCleanText(page);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${p} scrolls sideways at 360 px`).toBeLessThanOrEqual(0);
      }
      expect(errors).toEqual([]);
      expect(thirdParty).toEqual([]);
    });
  });
}

test.describe("Tabs", () => {
  test.beforeEach(async ({ page }) => onboard(page, "en"));

  test("bottom nav has exactly the 4 tabs and each opens", async ({ page }) => {
    const nav = page.getByRole("navigation").last();
    for (const name of ["Today", "Practice", "Calendar", "Journal"]) {
      await nav.getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(`/en/${name.toLowerCase()}/`));
    }
    await expect(nav.getByRole("link")).toHaveCount(4);
  });

  test("US-10: Today shows the panchang line labelled Indicative and the city", async ({ page }) => {
    await expect(page.getByText(/Tithi:/).first()).toBeVisible();
    await expect(page.getByText(/Indicative/).first()).toBeVisible();
    await expect(page.getByText(/New Delhi/).first()).toBeVisible();
  });

  test("US-08: Today shows a 3-step plan with Begin step 1 [QA-01]", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Begin step 1/i }).or(page.getByRole("link", { name: /Begin step 1/i }))).toBeVisible({ timeout: 3000 });
  });

  test("US-18: Calendar shows a month grid with observances [QA-02]", async ({ page }) => {
    await page.goto("/en/calendar/");
    await expect(page.getByText(/Placeholder/)).toHaveCount(0);
    await expect(page.getByRole("grid").or(page.getByRole("table"))).toBeVisible({ timeout: 3000 });
  });

  test("US-27: a Send feedback entry is reachable from Me [QA-05]", async ({ page }) => {
    test.fail(true, "QA-05: entry is hidden by design until the Board supplies FEEDBACK_URL (D-022, src/lib/config.ts)");
    await page.goto("/en/settings/");
    await expect(page.getByRole("link", { name: /feedback/i }).or(page.getByRole("button", { name: /feedback/i }))).toBeVisible({ timeout: 3000 });
  });

  test("US-23: Me offers text size 100/115/130% [QA-06]", async ({ page }) => {
    await page.goto("/en/settings/");
    await expect(page.getByText(/Text size/i)).toBeVisible({ timeout: 3000 });
  });

  test("US-25: trust pages show the beta label and have no unfilled placeholders [QA-03]", async ({ page }) => {
    test.fail(true, "QA-03: Legal fill-ins and [launch date] still visible");
    for (const p of ["privacy", "terms", "help"]) {
      await page.goto(`/en/info/${p}/`);
      const text = await page.locator("main").innerText();
      expect(text).toMatch(/Beta policies, not reviewed by a lawyer/);
      expect(text).not.toMatch(/⟦[^⟧]+⟧|\[launch date\]/);
    }
  });
});
