import { expect, test, type Page } from "@playwright/test";
import { expectCleanText, onboard, trackThirdParty } from "./helpers";

const status = (page: Page) => page.getByTestId("now-status");

test.describe("Sounds tab (D-026)", () => {
  test.beforeEach(async ({ page }) => {
    await onboard(page, "en");
    await page.goto("/en/sounds/");
  });

  test("nothing plays on arrival, and the page lists scenes, recordings and generated sounds", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sounds", level: 1 })).toBeVisible();
    await expect(status(page)).toHaveText(/Nothing is playing/);
    await expect(page.getByRole("button", { name: "Stop", exact: true })).toHaveCount(0);
    for (const n of ["Rain", "Fire", "Wind", "Conch", "Bell", "Om drone", "Soft bells", "So'ham"]) {
      await expect(page.getByRole("button", { name: `Play ${n}`, exact: true })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /^Play .*(Rain by the fire|Temple at night)/ })).toHaveCount(2);
    await expectCleanText(page);
  });

  test("a generated sound plays and stops with the visible Stop control", async ({ page }) => {
    await page.getByRole("button", { name: "Play Om drone", exact: true }).click();
    await expect(status(page)).toHaveText("Om drone");
    await expect(page.getByRole("button", { name: "Stop Om drone" })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await expect(status(page)).toHaveText(/Nothing is playing/);
    await expect(page.getByRole("button", { name: "Play Om drone", exact: true })).toHaveAttribute("aria-pressed", "false");
  });

  test("a recording loads from /audio/ with no third-party request, and starting another stops the first", async ({ page, baseURL }) => {
    const thirdParty = trackThirdParty(page, baseURL!);
    const audioReq = page.waitForRequest((r) => r.url().endsWith("/audio/nature/rain.mp3"));
    await page.getByRole("button", { name: "Play Rain", exact: true }).click();
    await audioReq;
    await expect(status(page)).toHaveText("Rain", { timeout: 10_000 });
    await page.getByRole("button", { name: "Play Fire", exact: true }).click();
    await expect(status(page)).toHaveText("Fire", { timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Stop Rain" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Stop Fire" })).toBeVisible();
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await expect(status(page)).toHaveText(/Nothing is playing/);
    expect(thirdParty).toEqual([]);
  });

  test("a scene layers sounds with a volume slider each, and one scene plays at a time", async ({ page }) => {
    await page.getByRole("button", { name: "Play Rain by the fire" }).click();
    await expect(status(page)).toHaveText("Rain by the fire", { timeout: 10_000 });
    const sliders = page.getByRole("slider");
    await expect(sliders).toHaveCount(2);
    await sliders.first().fill("30");
    await expect(sliders.first()).toHaveValue("30");
    await page.getByRole("button", { name: "Play Temple at night" }).click();
    await expect(status(page)).toHaveText("Temple at night", { timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Stop Rain by the fire" })).toHaveCount(0);
    await expect(page.getByRole("slider")).toHaveCount(3);
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await expect(page.getByRole("slider")).toHaveCount(0);
  });

  test("the sleep timer offers 10/20/30/60 minutes and shows the time left", async ({ page }) => {
    for (const m of ["10 min", "20 min", "30 min", "60 min"]) await expect(page.getByRole("button", { name: m, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Play So'ham", exact: true }).click();
    await page.getByRole("button", { name: "20 min", exact: true }).click();
    await expect(page.getByRole("button", { name: "20 min", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("sleep-left")).toHaveText(/Fades out in (19|20):\d\d/);
    await page.getByRole("button", { name: "Off", exact: true }).click();
    await expect(page.getByTestId("sleep-left")).toHaveCount(0);
  });

  test("sleep timer fades out and stops playback", async ({ page }) => {
    await page.clock.install();
    await page.getByRole("button", { name: "Play Om drone", exact: true }).click();
    await page.getByRole("button", { name: "10 min", exact: true }).click();
    await page.clock.runFor(10 * 60_000 + 500);
    await expect(status(page)).toHaveText(/Nothing is playing/);
  });
});

test.describe("Japa mala", () => {
  test.beforeEach(async ({ page }) => {
    await onboard(page, "en");
    await page.goto("/en/sounds/");
    await page.getByRole("button", { name: "Japa mala", exact: true }).click();
  });

  test("counts beads and keeps the count after a reload", async ({ page }) => {
    const tapBtn = page.getByTestId("japa-tap");
    for (let i = 0; i < 3; i++) await tapBtn.click();
    await expect(page.getByTestId("japa-beads")).toHaveText("3");
    await expect(page.getByTestId("japa-malas")).toContainText("3 beads in all");
    await page.waitForTimeout(300);
    await page.reload();
    await page.getByRole("button", { name: "Japa mala", exact: true }).click();
    await expect(page.getByTestId("japa-beads")).toHaveText("3");
  });

  test("the tap area is large", async ({ page }) => {
    const box = await page.getByTestId("japa-tap").boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(240);
    expect(box!.height).toBeGreaterThanOrEqual(240);
  });

  test("108 beads complete a mala, and reset asks first", async ({ page }) => {
    await page.evaluate(async () => {
      // Jump to 107 through the same store the page uses.
      const open = indexedDB.open("pranadin");
      await new Promise<void>((res, rej) => {
        open.onsuccess = () => {
          const tx = open.result.transaction("japa", "readwrite");
          tx.objectStore("japa").put({ v: 1, id: "japa", localDate: "2026-11-21", at: Date.now(), count: 107 });
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        };
        open.onerror = () => rej(open.error);
      });
    });
    await page.reload();
    await page.getByRole("button", { name: "Japa mala", exact: true }).click();
    await expect(page.getByTestId("japa-beads")).toHaveText("107");
    await page.getByTestId("japa-tap").click();
    await expect(page.getByRole("status").filter({ hasText: "Mala complete" })).toBeVisible();
    await page.getByRole("button", { name: "Begin the next mala" }).click();
    await expect(page.getByTestId("japa-beads")).toHaveText("0");
    await expect(page.getByTestId("japa-malas")).toContainText("1 mala");

    await page.getByRole("button", { name: "Reset count" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByTestId("japa-malas")).toContainText("1 mala");
    await page.getByRole("button", { name: "Reset count" }).click();
    await page.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(page.getByTestId("japa-malas")).toContainText("0 malas");
  });
});

test.describe("Audio credits and nav", () => {
  test("Sources page lists each recording with author, licence and link", async ({ page }) => {
    await onboard(page, "en");
    await page.goto("/en/info/sources/");
    await expect(page.getByRole("heading", { name: "Audio credits" })).toBeVisible();
    const list = page.getByTestId("audio-credits");
    await expect(list.getByRole("listitem")).toHaveCount(16);
    await expect(list).toContainText("ezwa");
    await expect(list).toContainText("CC BY-SA 4.0");
    await expect(list.getByRole("link").first()).toHaveAttribute("href", /^https:\/\/commons\.wikimedia\.org\//);
    // D-027: the AI-voiced mantras are credited and visibly labelled.
    await expect(list.getByText("AI-generated", { exact: false }).first()).toBeVisible();
  });

  test("5 tab labels stay inside the screen at 320 px and 200% text", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await onboard(page, "en");
    await page.goto("/en/sounds/");
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    const links = page.getByRole("navigation").last().getByRole("link");
    await expect(links).toHaveCount(5);
    const iw = await page.evaluate(() => window.innerWidth);
    for (let i = 0; i < 5; i++) {
      const b = await links.nth(i).boundingBox();
      expect(b!.x).toBeGreaterThanOrEqual(0);
      expect(b!.x + b!.width).toBeLessThanOrEqual(iw + 1);
    }
    // Nothing on the Sounds page itself pushes the page wider than the screen.
    const wide = await page.evaluate(() =>
      [...document.querySelectorAll("main *")].filter((e) => e.getBoundingClientRect().right > 321).map((e) => e.tagName),
    );
    expect(wide).toEqual([]);
    const clipped = await links.evaluateAll((els) => els.map((e) => e.scrollWidth > e.clientWidth + 1));
    expect(clipped).toEqual([false, false, false, false, false]);
  });
});
