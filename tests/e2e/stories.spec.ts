import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

test.describe("Story collections (D-038, D-040)", () => {
  test("Stories tab opens story collections; the Ramayana has 33 chapters by kanda that read in order", async ({ page }) => {
    await onboard(page, "en");
    await page.getByRole("navigation").last().getByRole("link", { name: "Stories" }).click();
    await expect(page).toHaveURL(/\/en\/stories\/$/);
    for (const t of ["Hindu", "Sikh", "Buddhist", "Jain", "Christian", "Islamic"]) await expect(page.getByRole("heading", { level: 2, name: t })).toBeVisible();
    for (const c of ["Mahabharata", "Shri Gurucharitra", "Shri Sai Satcharitra", "Varkari saints"]) await expect(page.getByRole("link", { name: new RegExp(c) })).toBeVisible();

    await page.getByRole("link", { name: /Ramayana/ }).first().click();
    await expect(page).toHaveURL(/\/stories\/ramayana\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ramayana");
    await expect(page.getByRole("heading", { level: 2, name: /Sundara Kanda/ })).toBeVisible();
    await expect(page.getByTestId("club-chapters").locator(":scope > li")).toHaveCount(33);

    await page.getByRole("link", { name: "Start reading" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The cry that became a poem");
    await expect(page.getByText("Chapter 1 of 33")).toBeVisible();
    await expect(page.getByTestId("story-scenes").locator(":scope > li")).toHaveCount(6);
    await expect(page.getByText("From the scripture")).toBeVisible();
    await expect(page.getByText("Pause and reflect")).toBeVisible();
    await expect(page.getByTestId("story-credits")).toContainText("Wikimedia Commons");

    await page.getByTestId("chapter-nav").getByRole("link", { name: /Next chapter/ }).click();
    await expect(page.getByText("Chapter 2 of 33")).toBeVisible();
    await expect(page.getByTestId("chapter-nav").getByRole("link", { name: /Previous chapter/ })).toBeVisible();

    await page.goto("/en/stories/ramayana/earths-embrace/");
    await expect(page.getByText("You have reached the end of this collection.")).toBeVisible();
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    expect(broken).toEqual([]);
  });

  test("The Mahabharata has 33 chapters by parva, with the Gita at its heart (D-041)", async ({ page }) => {
    await onboard(page, "en");
    await page.goto("/en/stories/mahabharata/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mahabharata");
    await expect(page.getByRole("heading", { level: 2, name: /Bhishma Parva/ })).toBeVisible();
    await expect(page.getByTestId("club-chapters").locator(":scope > li")).toHaveCount(33);
    await page.goto("/en/stories/mahabharata/the-bhagavad-gita/");
    await expect(page.getByText("Chapter 22 of 33")).toBeVisible();
    await expect(page.getByTestId("story-scenes").locator(":scope > li")).toHaveCount(6);
    await expect(page.getByText("कर्मण्येवाधिकारस्ते", { exact: false })).toBeVisible();
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    expect(broken).toEqual([]);
  });

  test("Gita, Dnyaneshwari and Gurucharitra are detailed illustrated summaries (D-041, D-043)", async ({ page }) => {
    await onboard(page, "en");
    for (const [club, count, part] of [
      ["bhagavad-gita", 18, /path of devotion/],
      ["dnyaneshwari", 20, /Karma: work as worship/],
      ["gurucharitra", 53, /Bhakti kanda/],
    ] as const) {
      await page.goto(`/en/stories/${club}/`);
      await expect(page.getByTestId("club-chapters").locator(":scope > li")).toHaveCount(count);
      await expect(page.getByRole("heading", { level: 2, name: part })).toBeVisible();
    }
    await page.goto("/en/stories/bhagavad-gita/the-undying-self/");
    await expect(page.getByTestId("story-scenes").locator(":scope > li")).toHaveCount(6);
    await expect(page.locator('p[lang="sa"]')).toContainText("कर्मण्येवाधिकारस्ते");
    await page.goto("/en/stories/dnyaneshwari/pasayadan-and-alandi/");
    await expect(page.locator('p[lang="mr"]')).toContainText("जो जे वांछील तो ते लाहो");
    await expect(page.getByText("You have reached the end of this collection.")).toBeVisible();
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    expect(broken).toEqual([]);
  });

  for (const lang of ["hi", "mr"] as const) {
    test(`${lang} collection and chapter pages are translated`, async ({ page }) => {
      await onboard(page, lang);
      for (const p of ["stories/ramayana/", "stories/ramayana/great-leap/", "stories/varkari/dnyaneshwar/", "stories/mahabharata/the-bhagavad-gita/", "stories/bhagavad-gita/", "stories/dnyaneshwari/pasayadan-and-alandi/", "stories/gurucharitra/dull-boy-of-kuravpur/"]) {
        await page.goto(`/${lang}/${p}`);
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
        expect(text, p).not.toMatch(/[A-Za-z]{3,} [A-Za-z]{3,} [A-Za-z]{3,}/);
      }
    });
  }
});
