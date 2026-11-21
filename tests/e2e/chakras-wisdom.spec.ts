import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

test.describe("Chakras and verse of the day (D-026 Wave C)", () => {
  test.beforeEach(async ({ page }) => onboard(page, "en"));

  test("chakras list shows seven, and a detail page opens with tradition framing", async ({ page }) => {
    await page.goto("/en/practice/chakras/");
    await expect(page.getByRole("heading", { level: 1, name: "Chakras" })).toBeVisible();
    await expect(page.locator('a[href*="/practice/chakras/"]')).toHaveCount(7);
    await page.locator('a[href$="/practice/chakras/anahata/"]').click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("अनाहत");
    await expect(page.getByText(/not as medicine/i)).toBeVisible();
    await expect(page.getByRole("img", { name: /12 petals/ })).toBeVisible();
    await page.getByRole("link", { name: "All chakras" }).click();
    await expect(page).toHaveURL(/\/practice\/chakras\/$/);
  });

  test("Hindi draft text is shown on chakras", async ({ page }) => {
    await page.goto("/hi/practice/chakras/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("चक्र");
  });

  test("Today shows one verse with script, meaning and reference; Share copies when navigator.share is missing", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
      const store: { v: string } = { v: "" };
      Object.defineProperty(navigator, "clipboard", { value: { writeText: async (t: string) => void (store.v = t) }, configurable: true });
      (window as unknown as { __clip: typeof store }).__clip = store;
    });
    await page.goto("/en/today/");
    const card = page.locator("section[data-verse-id]");
    await expect(card).toHaveCount(1);
    await expect(card.getByRole("heading", { name: "Verse of the day" })).toBeVisible();
    await expect(card.getByText("Meaning", { exact: true })).toBeVisible();
    const id = await card.getAttribute("data-verse-id");
    await card.getByRole("button", { name: "Share verse" }).click();
    await expect(page.getByText("Copied. You can paste it anywhere.")).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __clip: { v: string } }).__clip.v)).toContain("PranaDin");
    await page.reload();
    await expect(page.locator("section[data-verse-id]")).toHaveAttribute("data-verse-id", id!);
  });

  test("Share uses navigator.share when available", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __shared: unknown }).__shared = null;
      Object.defineProperty(navigator, "share", { value: async (d: unknown) => void ((window as unknown as { __shared: unknown }).__shared = d), configurable: true });
    });
    await page.goto("/en/today/");
    await page.getByRole("button", { name: "Share verse" }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __shared: unknown }).__shared)).toMatchObject({ title: "Verse of the day" });
  });
});
