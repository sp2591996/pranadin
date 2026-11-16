import { expect, test } from "@playwright/test";
import { onboard, simulateBackground, trackThirdParty } from "./helpers";

test.describe("Practice (US-11 to US-16)", () => {
  test.beforeEach(async ({ page }) => onboard(page, "en"));

  test("US-11: exactly the 4 approved techniques are listed, with no breath-holding", async ({ page }) => {
    await page.goto("/en/practice/");
    const breath = page.locator('a[href*="/practice/breath/"]');
    await expect(breath).toHaveCount(4);
    for (const name of ["Sama Vritti", "Deergha", "Nadi Shodhana", "Bhramari"]) {
      await expect(breath.filter({ hasText: name })).toHaveCount(1);
    }
    await expect(page.getByText("No breath-holding")).toBeVisible();
  });

  test("US-12: the caution blocks the first start, then is one tap away", async ({ page }) => {
    await page.goto("/en/practice/breath/sama-vritti/");
    await expect(page.getByText("Practise safely")).toBeVisible();
    await expect(page.getByRole("button", { name: "Begin" })).toHaveCount(0);
    await page.getByRole("button", { name: "I understand" }).click();
    await expect(page.getByRole("button", { name: "Begin" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Begin" })).toBeVisible();
    await expect(page.getByText("Safety", { exact: true })).toBeVisible();
    await expect(page.getByText("Practise safely")).toBeHidden();
  });

  test("US-11/US-16: a finished session is marked complete and fills the week, offline of any network", async ({ page, baseURL }) => {
    const thirdParty = trackThirdParty(page, baseURL!);
    await page.clock.install();
    await page.goto("/en/practice/breath/sama-vritti/");
    await page.getByRole("button", { name: "I understand" }).click();
    await page.getByRole("button", { name: "2 min" }).click();
    await page.getByRole("button", { name: "Begin" }).click();
    await page.clock.runFor(125_000);
    await expect(page.getByText("Well done")).toBeVisible();
    await expect(page.getByText(/Completed/).first()).toBeVisible();
    // US-35: reminder is offered once after the first completion, and is dismissible.
    await expect(page.getByRole("button", { name: /daily reminder/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Not now" })).toBeVisible();
    await page.goto("/en/practice/");
    await expect(page.getByText(/1 day in a row/)).toBeVisible();
    expect(thirdParty).toEqual([]);
  });

  test("US-13: ending before 80% asks first and says it won't count", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en/practice/breath/deergha/");
    await page.getByRole("button", { name: "I understand" }).click();
    await page.getByRole("button", { name: "2 min" }).click();
    await page.getByRole("button", { name: "Begin" }).click();
    await page.clock.runFor(30_000);
    await page.getByRole("button", { name: "End" }).click();
    await expect(page.getByText(/won't be marked complete/)).toBeVisible();
  });

  test("US-13: leaving the app pauses the practice and offers Resume / End", async ({ page }) => {
    await page.goto("/en/practice/breath/sama-vritti/");
    await page.getByRole("button", { name: "I understand" }).click();
    await page.getByRole("button", { name: "Begin" }).click();
    await expect(page.getByText("Breathe in").first()).toBeVisible({ timeout: 6000 });
    await simulateBackground(page);
    await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
    await expect(page.getByRole("button", { name: "End" })).toBeVisible();
  });

  test("US-15: ambience is generated on the device (no audio downloads)", async ({ page }) => {
    const media: string[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "media" || /\.(mp3|ogg|wav|m4a|aac|opus)(\?|$)/.test(r.url())) media.push(r.url());
    });
    await page.goto("/en/practice/stillness/silent/");
    await expect(page.getByRole("radio", { name: "Silence" })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("radio", { name: "Rain" }).click();
    await page.getByRole("button", { name: "Start" }).click();
    await page.waitForTimeout(1500);
    expect(media).toEqual([]);
  });
});

test.describe("US-29: reduced motion", () => {
  for (const reducedMotion of ["reduce", "no-preference"] as const) {
    test(`breath guide with prefers-reduced-motion: ${reducedMotion}`, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext({ reducedMotion, baseURL, viewport: { width: 360, height: 780 } });
      const page = await ctx.newPage();
      await onboard(page, "en");
      await page.goto("/en/practice/breath/sama-vritti/");
      await page.getByRole("button", { name: "I understand" }).click();
      await page.getByRole("button", { name: "Begin" }).click();
      await expect(page.getByText("Breathe in").first()).toBeVisible({ timeout: 6000 });
      await page.waitForTimeout(500);
      const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
      if (reducedMotion === "reduce") expect(running).toBe(0);
      else expect(running).toBeGreaterThan(0);
      await ctx.close();
    });
  }
});
