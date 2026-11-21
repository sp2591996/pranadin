import { expect, test } from "@playwright/test";
import { expectCleanText, onboard, trackThirdParty } from "./helpers";

test.describe("Yoga (D-026/D-027)", () => {
  test.beforeEach(async ({ page }) => onboard(page, "en"));

  test("library -> pose (caption, cautions, source) -> safety notice -> session player", async ({ page, baseURL }) => {
    const thirdParty = trackThirdParty(page, baseURL!);
    await page.goto("/en/practice/");
    await page.getByRole("link", { name: /^Yoga/ }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Yoga" })).toBeVisible();
    await expect(page.getByTestId("pose-list").locator("li")).toHaveCount(29);
    await page.getByRole("button", { name: "Beginner", exact: true }).click();
    const beginner = await page.getByTestId("pose-list").locator("li").count();
    expect(beginner).toBeGreaterThan(0);
    expect(beginner).toBeLessThan(29);

    await page.getByTestId("pose-list").locator("a").first().click();
    await expect(page.getByRole("heading", { name: "Take care" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
    await expect(page.locator("figure figcaption")).toHaveText("AI-generated image");
    await expectCleanText(page);

    await page.goto("/en/practice/yoga/");
    await page.getByRole("button", { name: "Sessions" }).click();
    await page.getByTestId("session-list").locator("a").first().click();
    // Safety notice blocks the first start.
    await expect(page.getByText("Before you begin")).toBeVisible();
    await expect(page.getByRole("button", { name: "Start session" })).toHaveCount(0);
    await page.getByRole("button", { name: "I understand" }).click();
    await page.getByRole("button", { name: "Start session" }).click();
    await expect(page.getByText(/^Step 1 of/)).toBeVisible();
    await expect(page.getByTestId("step-title")).toBeVisible();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.getByText(/^Step 2 of/)).toBeVisible();
    for (const cap of await page.locator("figure figcaption").allTextContents()) expect(cap).toBe("AI-generated image");
    await expectCleanText(page);
    expect(thirdParty).toEqual([]);
  });

  test("programme progress is saved on the device", async ({ page }) => {
    await page.clock.install();
    await page.goto("/en/practice/yoga/program/beginner-7/");
    await expect(page.getByTestId("prog-progress")).toHaveText("0 of 7 days done");
    await page.getByRole("link", { name: "Start day 1" }).first().click();
    await page.getByRole("button", { name: "I understand" }).click();
    await page.getByRole("button", { name: "Start session" }).click();
    await page.clock.runFor(40 * 60_000);
    await expect(page.getByRole("heading", { name: "Session complete" })).toBeVisible();
    await page.getByRole("link", { name: /programme|program/i }).first().click();
    await expect(page.getByTestId("prog-progress")).toHaveText("1 of 7 days done");

    await page.getByRole("button", { name: "Mark day 3 done" }).click();
    await expect(page.getByTestId("prog-progress")).toHaveText("2 of 7 days done");
    await page.reload();
    await expect(page.getByTestId("prog-progress")).toHaveText("2 of 7 days done");
    await expect(page.getByRole("button", { name: "Undo day 3" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue with day 2" })).toBeVisible();

    // The library shows the saved progress too.
    await page.goto("/en/practice/yoga/");
    await page.getByRole("button", { name: "Programmes" }).click();
    await expect(page.getByTestId("program-list")).toContainText("2 of 7 days done");
  });

  test("HI shows the Hindi draft text (D-030)", async ({ page }) => {
    await page.goto("/hi/practice/yoga/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("योग");
  });
});
