import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

test.describe("Stories (D-038)", () => {
  test("Calendar hub opens stories grouped by tradition and region; a story has scenes, a lesson and credits", async ({ page }) => {
    await onboard(page, "en");
    await page.goto("/en/calendar/");
    await page.getByRole("navigation", { name: "Calendar sections" }).getByRole("link", { name: "Stories" }).click();
    await expect(page).toHaveURL(/\/en\/calendar\/stories\/$/);
    await expect(page.getByRole("heading", { level: 2, name: "Hindu" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Maharashtra" }).first()).toBeVisible();
    for (const t of ["Sikh", "Buddhist", "Jain", "Christian", "Islamic"]) await expect(page.getByRole("heading", { level: 2, name: t })).toBeVisible();
    await page.getByRole("link", { name: /Lamps that burned with water/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Lamps that burned with water");
    await expect(page.getByTestId("story-scenes").locator(":scope > li")).toHaveCount(3);
    await expect(page.getByText("What it teaches")).toBeVisible();
    await expect(page.getByTestId("story-credits")).toContainText("Wikimedia Commons");
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    expect(broken).toEqual([]);
  });

  for (const lang of ["hi", "mr"] as const) {
    test(`${lang} story pages are translated`, async ({ page }) => {
      await onboard(page, lang);
      await page.goto(`/${lang}/calendar/stories/dnyaneshwar/`);
      const text = await page.evaluate(() => {
        const out: string[] = [];
        const w = document.createTreeWalker(document.querySelector("main")!, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const el = n.parentElement;
          if (!el || el.closest("[lang='en']")) continue;
          out.push(n.textContent ?? "");
        }
        return out.join(" ");
      });
      expect(text).not.toMatch(/[A-Za-z]{3,} [A-Za-z]{3,} [A-Za-z]{3,}/);
    });
  }
});
