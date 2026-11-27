import { expect, test } from "@playwright/test";
import { LOCALES, onboard } from "./helpers";

const ALLOW = ["PranaDin", "Beta", "VNS", "BSB", "PVR"];
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

test.describe("Yatra guide", () => {
  test("Practice entry to list, filters, detail, itinerary and photo credit", async ({ page }) => {
    await onboard(page, "en");
    await page.goto("/en/practice/");
    await page.getByRole("link", { name: /Yatra guide/i }).first().click();
    await expect(page).toHaveURL(/\/en\/practice\/yatra\/$/);
    const cards = page.locator("main li a[href*='/practice/yatra/']");
    const total = await cards.count();
    expect(total).toBeGreaterThanOrEqual(2);

    // Filters narrow the list; counts stay valid as more places are added.
    await page.getByLabel("State").selectOption("maharashtra");
    await expect(cards.filter({ hasText: "Pandharpur" })).toHaveCount(1);
    expect(await cards.count()).toBeLessThan(total);
    await page.getByLabel("State").selectOption("all");
    await page.getByLabel("Month to visit").selectOption("7");
    expect(await cards.count()).toBeLessThanOrEqual(total);
    await page.getByLabel("Month to visit").selectOption("0");
    await page.getByRole("button", { name: /^Hindu$/ }).click();
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
    await page.getByRole("button", { name: /^Buddhist$/ }).click();
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
    expect(await cards.count()).toBeLessThan(total);

    await page.goto("/en/practice/yatra/varanasi/");
    await expect(page.locator("h1")).toContainText("Varanasi");
    await expect(page.getByTestId("photo-credit")).toContainText("Wikimedia Commons");
    await expect(page.locator("[data-testid=gallery] img").first()).toBeVisible();
    await page.getByRole("tab", { name: /Itineraries/ }).click();
    await page.getByRole("button", { name: /^2 days$/ }).click();
    await expect(page.getByRole("heading", { name: "Day 2" })).toBeVisible();
    await page.getByRole("tab", { name: /Sights and darshan/ }).click();
    await expect(page.getByText("Check locally").first()).toBeVisible();
    await page.getByRole("tab", { name: /Stay and eat/ }).click();
    await expect(page.getByText(/Indicative only/).first()).toBeVisible();
  });

  test("Pandharpur shows a photo placeholder, not a fake photo", async ({ page }) => {
    await onboard(page, "en");
    await page.goto("/en/practice/yatra/pandharpur/");
    await expect(page.getByText("A photo will be added here.")).toBeVisible();
  });

  test("planner builds a combined plan and saves it on the device", async ({ page }) => {
    await onboard(page, "en");
    await page.goto("/en/practice/yatra/varanasi/");
    await page.getByRole("tab", { name: /Itineraries/ }).click();
    await page.getByRole("button", { name: "Add to my trip" }).click();
    await expect(page.getByRole("button", { name: "In your trip" })).toBeDisabled();

    await page.goto("/en/practice/yatra/plan/");
    await expect(page.getByTestId("trip-items").locator("li")).toHaveCount(1);
    await page.getByLabel("Search places").fill("Pandhar");
    await page.getByRole("button", { name: "Add Pandharpur" }).click();
    await page.getByRole("group", { name: "Days at Pandharpur" }).getByRole("button", { name: "2 days at Pandharpur" }).click();
    await expect(page.getByTestId("trip-total")).toContainText("3");
    await expect(page.getByTestId("trip-plan").locator("ol > li")).toHaveCount(3);
    await page.getByRole("button", { name: "Move Pandharpur earlier" }).click();
    await expect(page.getByTestId("trip-plan").locator("ol > li").first()).toContainText("Pandharpur");
    await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy as text" })).toBeVisible();

    // Start date drives dated days; Kedarnath in January triggers the season check.
    await page.getByRole("button", { name: /Ganga to Kedarnath/ }).click();
    await expect(page.getByTestId("trip-items").locator("li")).toHaveCount(3);
    await page.getByLabel("Start date").fill("2027-01-10");
    await expect(page.getByTestId("season-warnings")).toContainText("Kedarnath");
    await page.getByRole("button", { name: "One more traveller" }).click();
    await expect(page.getByText(/for 3 travellers/)).toBeVisible();
    await page.getByRole("button", { name: /Kashi and Sarnath/ }).click();
    await page.getByLabel("Search places").fill("Pandhar");
    await page.getByRole("button", { name: "Add Pandharpur" }).click();
    await page.getByRole("button", { name: "2 days at Pandharpur" }).click();
    await page.getByRole("button", { name: "Remove Sarnath" }).click();
    await page.getByRole("button", { name: "Move Pandharpur earlier" }).click();

    // Saved in IndexedDB: survives a reload.
    await page.waitForTimeout(300);
    await page.reload();
    await expect(page.getByTestId("trip-items").locator("li")).toHaveCount(2);
    await expect(page.getByTestId("trip-total")).toContainText("4");
    const stored = await page.evaluate(
      () =>
        new Promise<unknown>((resolve) => {
          const open = indexedDB.open("pranadin");
          open.onsuccess = () => {
            const get = open.result.transaction("trips").objectStore("trips").get("trip");
            get.onsuccess = () => resolve(get.result);
          };
        }),
    );
    expect((stored as { items: unknown[] }).items).toHaveLength(2);
  });

  for (const lang of LOCALES.filter((l) => l !== "en")) {
    test(`${lang} list, detail tabs and planner have no English runs`, async ({ page }) => {
      await onboard(page, lang);
      for (const p of ["practice/yatra/", "practice/yatra/varanasi/", "practice/yatra/pandharpur/", "practice/yatra/plan/"]) {
        await page.goto(`/${lang}/${p}`);
        await expect(page.locator("h1")).toBeVisible();
        const tabs = page.getByRole("tab");
        const n = await tabs.count();
        for (let i = 0; i < Math.max(n, 1); i++) {
          if (n) await tabs.nth(i).click();
          const text = await page.evaluate(() => {
            const out: string[] = [];
            const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            for (let node = w.nextNode(); node; node = w.nextNode()) {
              const el = node.parentElement;
              if (!el || el.closest("script,style,noscript,[hidden],[aria-hidden='true']")) continue;
              const l = el.closest("[lang]")?.getAttribute("lang");
              if (l === "en" || l?.endsWith("-Latn")) continue;
              out.push(node.textContent ?? "");
            }
            return out.join(" ");
          });
          expect(englishRun(text), `${lang}/${p} tab ${i}`).toBeNull();
        }
      }
    });
  }
});
