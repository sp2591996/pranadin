import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { onboard, trackThirdParty } from "./helpers";

test.describe("Journal (US-20 to US-22)", () => {
  test.beforeEach(async ({ page }) => onboard(page, "en"));

  test("write, persist, export and delete an entry without any network request", async ({ page, baseURL }) => {
    const thirdParty = trackThirdParty(page, baseURL!);
    const sent: string[] = [];
    page.on("request", (r) => {
      if (/QA-e2e/.test(r.url() + (r.postData() ?? ""))) sent.push(r.url());
    });
    await page.goto("/en/journal/");
    // US-21 empty state + US-22 export disabled with a note
    await expect(page.getByText("No reflections yet")).toBeVisible();
    await expect(page.getByRole("button", { name: /text \(\.txt\)/ }).first()).toBeDisabled();

    await page.getByRole("button", { name: "Write a reflection" }).click();
    await expect(page.getByText(/of 1,000 characters/)).toBeVisible();
    await expect(page.getByText(/Saved only on this phone/)).toBeVisible();
    for (const mood of ["Peaceful", "Grateful", "Okay", "Restless", "Heavy"]) {
      await expect(page.getByRole("button", { name: mood })).toBeVisible();
    }
    await page.locator("textarea").fill("QA-e2e line");
    await page.getByRole("button", { name: "Peaceful" }).click();
    await page.getByRole("button", { name: /^Save/ }).click();
    await page.reload();
    await expect(page.getByText("QA-e2e line")).toBeVisible();

    const [txt] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /text \(\.txt\)/ }).first().click()]);
    expect(readFileSync((await txt.path())!, "utf8")).toContain("QA-e2e line");
    const [json] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /data \(\.json\)/ }).first().click()]);
    expect(JSON.parse(readFileSync((await json.path())!, "utf8")).entries).toHaveLength(1);

    await page.getByRole("button", { name: /Delete/ }).first().click();
    const dialog = page.getByRole("dialog").or(page.getByRole("alertdialog")).first();
    await expect(dialog).toContainText(/\d{1,2} \w+/); // names the entry's date
    await dialog.getByRole("button", { name: "Delete" }).click();
    await page.reload();
    await expect(page.getByText("QA-e2e line")).toHaveCount(0);
    expect(sent).toEqual([]);
    expect(thirdParty).toEqual([]);
  });

  test("US-20: the editor notice says anyone using this phone can open it [QA-15]", async ({ page }) => {
    test.fail(true, "QA-15: sentence missing from the notice");
    await page.goto("/en/journal/");
    await page.getByRole("button", { name: "Write a reflection" }).click();
    await expect(page.getByText(/Anyone using this phone can open it/)).toBeVisible({ timeout: 2000 });
  });
});

test.describe("Me (US-23, US-24, US-35)", () => {
  test.beforeEach(async ({ page }) => onboard(page, "en"));

  test("US-01/US-23: changing language re-renders without a reload", async ({ page }) => {
    await page.goto("/en/settings/");
    await page.evaluate(() => ((window as unknown as { __mark: number }).__mark = 1));
    await page.getByRole("link", { name: "मराठी" }).first().click();
    await expect(page).toHaveURL(/\/mr\/settings\//);
    expect(await page.evaluate(() => (window as unknown as { __mark?: number }).__mark)).toBe(1);
  });

  test("US-35: the reminder is a daily .ics made on the device with no personal id", async ({ page, baseURL }) => {
    const thirdParty = trackThirdParty(page, baseURL!);
    await page.goto("/en/settings/");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /daily reminder/i }).click()]);
    const ics = readFileSync((await dl.path())!, "utf8");
    expect(ics).toMatch(/RRULE:FREQ=DAILY/);
    expect(ics).toMatch(/DTSTART;TZID=[^:]+:\d{8}T070000/);
    expect(ics).toMatch(/URL:[^\r\n]*\/en\/today\/\r?\n/);
    const url = ics.match(/^URL:(.*)$/m)?.[1] ?? "";
    expect(url).not.toMatch(/[?#]/); // no query or fragment that could carry an id
    expect(thirdParty).toEqual([]);
  });

  test("US-24: Clear my data wipes storage and restarts at onboarding", async ({ page }) => {
    await page.goto("/en/settings/");
    await page.getByRole("button", { name: "Clear my data" }).click();
    const dialog = page.getByRole("dialog").or(page.getByRole("alertdialog")).first();
    await expect(dialog).toContainText(/journal/);
    await expect(dialog).toContainText(/can't be undone/);
    await dialog.getByRole("button", { name: /Delete everything/ }).click();
    await page.waitForURL(/\/onboarding\//);
    const left = await page.evaluate(async () => ({
      ls: Object.keys(localStorage).filter((k) => k.startsWith("pranadin.")),
      dbs: (await indexedDB.databases()).map((d) => d.name),
      caches: await caches.keys(),
    }));
    expect(left).toEqual({ ls: [], dbs: [], caches: [] });
  });

  test("US-06: switching analytics off in Me stores the refusal", async ({ page }) => {
    await page.goto("/en/settings/");
    const sw = page.getByRole("switch");
    if (!(await sw.isChecked())) await sw.click();
    await sw.click();
    const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem("pranadin.prefs.v1") ?? "{}"));
    expect(prefs.analyticsConsent).toBe("denied");
  });
});
