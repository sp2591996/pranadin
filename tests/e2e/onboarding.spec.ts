import { expect, test } from "@playwright/test";
import { NATIVE, nextStep, onboard, trackThirdParty } from "./helpers";

const primary = "section button.bg-primary";

test.describe("Onboarding (US-01, US-03 to US-07)", () => {
  for (const [phone, lang] of [
    ["en-IN", "en"],
    ["hi-IN", "hi"],
    ["mr-IN", "mr"],
  ] as const) {
    test(`US-01: a ${phone} phone gets ${NATIVE[lang]} pre-selected, all languages in their own script`, async ({ browser, baseURL }) => {
      const ctx = await browser.newContext({ locale: phone, baseURL });
      const page = await ctx.newPage();
      await page.goto("/");
      await page.waitForURL(new RegExp(`/${lang}/onboarding/`));
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("radio", { name: NATIVE[lang] })).toHaveAttribute("aria-checked", "true");
      for (const name of Object.values(NATIVE)) await expect(page.getByRole("radio", { name })).toBeVisible();
      await ctx.close();
    });
  }

  test("US-04: primary path reaches Today in ≤ 6 screens and ≤ 8 taps, with no third-party requests", async ({ page, baseURL }) => {
    const thirdParty = trackThirdParty(page, baseURL!);
    await page.goto("/");
    await page.waitForURL(/\/onboarding\//);
    let taps = 0;
    let screens = 1;
    // Continue on language, then I understand / Continue x3, then Continue on city.
    while (!/\/today\//.test(page.url()) && taps < 10) {
      await page.locator(primary).first().click();
      taps++;
      if (!/\/today\//.test(page.url())) screens++;
      await page.waitForTimeout(150);
    }
    await expect(page).toHaveURL(/\/en\/today\/$/);
    expect(screens).toBeLessThanOrEqual(6);
    expect(taps).toBeLessThanOrEqual(8);
    expect(thirdParty).toEqual([]);
  });

  test("US-04/US-07: every step after Welcome has Back and Skip; skipping all gives Calm, 10 min, New Delhi", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/onboarding\//);
    await nextStep(page); // language
    await nextStep(page); // welcome: I understand (no Skip by design, US-03)
    for (let step = 0; step < 3; step++) {
      await expect(page.locator("section").getByRole("button", { name: "Back" })).toBeVisible();
      const heading = await page.locator("section h2").first().innerText();
      await page.getByRole("button", { name: "Skip" }).click();
      if (step < 2) await expect(page.locator("section h2").first()).not.toHaveText(heading);
    }
    await page.waitForURL(/\/en\/today\//);
    const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem("pranadin.prefs.v1") ?? "{}"));
    expect(prefs).toMatchObject({ goal: "calm", minutes: 10, onboarded: true });
    expect(prefs.cityId ?? "new-delhi").toBe("new-delhi");
    await expect(page.getByText("New Delhi (default)", { exact: false }).first()).toBeVisible();
    await page.goto("/");
    await expect(page).toHaveURL(/\/en\/today\//); // US-07: reopen lands on Today
  });

  test("US-03: Read full disclaimer opens the page and Back returns to onboarding", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/onboarding\//);
    await nextStep(page);
    await page.getByRole("link", { name: /full disclaimer/i }).click();
    await expect(page).toHaveURL(/\/en\/info\/disclaimer\//);
    await page.goBack();
    await expect(page).toHaveURL(/\/en\/onboarding\//);
    await expect(page.getByRole("button", { name: "I understand" })).toBeVisible();
  });

  test("US-03: a first-time user cannot reach Today without tapping I understand [QA-04]", async ({ page }) => {
    await page.goto("/en/today/");
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/onboarding\//);
  });

  test("US-05: typing 'Pu' finds Pune, only the city id is stored, no location prompt", async ({ page, context }) => {
    let geoAsked = false;
    await context.exposeFunction("__geoAsked", () => {
      geoAsked = true;
    });
    await context.addInitScript(() => {
      const w = window as unknown as { __geoAsked: () => void };
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition = () => w.__geoAsked();
        navigator.geolocation.watchPosition = () => {
          w.__geoAsked();
          return 0;
        };
      }
    });
    await page.goto("/");
    await page.waitForURL(/\/onboarding\//);
    for (let i = 0; i < 4; i++) await nextStep(page);
    await page.getByRole("textbox").or(page.getByRole("searchbox")).first().fill("Pu");
    await page.getByRole("radio", { name: "Pune" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL(/\/en\/today\//);
    const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem("pranadin.prefs.v1") ?? "{}"));
    expect(prefs.cityId).toBe("pune");
    expect(geoAsked).toBe(false);
  });

  test("onboarding helper reaches Today in Marathi", async ({ page }) => {
    await onboard(page, "mr");
    await expect(page.locator("html")).toHaveAttribute("lang", "mr");
  });
});
