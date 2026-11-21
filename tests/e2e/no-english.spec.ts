import { expect, test, type Page } from "@playwright/test";
import { onboard, P0_PAGES } from "./helpers";

/**
 * D-030: when Marathi or Hindi is chosen, the whole app is in that language.
 * Fails when visible text holds a run of 3 or more consecutive English words.
 */
const EXTRA_PAGES = [
  "info/ai-use/",
  "info/corrections/",
  "practice/yoga/",
  "practice/yoga/pose/tadasana/",
  "practice/yoga/pose/ardha-matsyendrasana/",
  "practice/yoga/session/morning-surya-flow/",
  "practice/yoga/program/beginner-7/",
  "practice/chakras/",
  "practice/chakras/anahata/",
  "practice/stillness/breath-awareness/",
  "practice/breath/nadi-shodhana/",
];

/** Allowed English: product name, Beta, source titles and licence names. */
const ALLOW = [
  "PranaDin",
  "Beta",
  "Common Yoga Protocol",
  "Drik Panchang",
  "Hindu Blog",
  "Catholic Church Times",
  "Lion's Roar",
  "Phosphor Icons",
  "MIT License",
  "SIL Open Font License",
  "Open Font License",
  "Creative Commons",
  "Public Domain",
  "Light on Yoga",
  "Tele-MANAS",
  "Bhagavad Gita",
  "Yoga Sutras",
  "Guru Granth Sahib",
  "Government of India",
  "Ministry of AYUSH",
  "AI-generated",
];

/** Visible text outside elements marked `lang="en"` (source titles, URLs, transliterations). */
async function visibleText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const out: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || el.closest("script,style,noscript,[hidden],[aria-hidden='true']")) continue;
      const lang = el.closest("[lang]")?.getAttribute("lang");
      if (lang === "en" || lang?.endsWith("-Latn")) continue; // source titles, names, transliterations
      out.push(n.textContent ?? "");
    }
    return out.join(" ");
  });
}

export function englishRun(text: string): string | null {
  let t = text;
  for (const a of ALLOW) t = t.split(a).join(" | ");
  const tokens = t.split(/\s+/).filter(Boolean);
  let run: string[] = [];
  for (const tok of [...tokens, "|"]) {
    if (/^[A-Za-z][A-Za-z'’-]*[,.;:!?]?$/.test(tok)) {
      run.push(tok);
      if (run.length >= 3) return run.join(" ");
    } else run = [];
  }
  return null;
}

for (const lang of ["mr", "hi"] as const) {
  test.describe(`No English runs in ${lang}`, () => {
    test(`every P0 page, sounds, yoga, a pose, chakras and the Today verse are fully in ${lang}`, async ({ page }) => {
      const found: string[] = [];
      // Onboarding steps, in the chosen language (the language picker shows native names only).
      await page.goto(`/${lang}/onboarding/`);
      for (let i = 0; i < 4; i++) {
        await page.waitForTimeout(200);
        const run = englishRun(await visibleText(page));
        if (run) found.push(`onboarding step ${i}: "${run}"`);
        const btn = page.locator("section button.bg-primary").first();
        if (i < 3 && (await btn.count())) await btn.click();
      }
      await onboard(page, lang);
      for (const p of [...P0_PAGES, ...EXTRA_PAGES]) {
        const res = await page.goto(`/${lang}/${p}`);
        expect(res?.status(), p).toBe(200);
        await expect(page.locator("main")).toBeVisible();
        await page.waitForTimeout(250);
        const run = englishRun(await visibleText(page));
        if (run) found.push(`${p}: "${run}"`);
      }
      // The Today verse card is part of Today.
      await page.goto(`/${lang}/today/`);
      await expect(page.locator("section[data-verse-id]")).toHaveCount(1);
      expect(found).toEqual([]);
    });
  });
}

test("englishRun flags three English words and allows the allow-list", () => {
  expect(englishRun("आज Sit comfortably and rest")).toBe("Sit comfortably and");
  expect(englishRun("प्राणदिन PranaDin Beta Common Yoga Protocol आयुष")).toBeNull();
  expect(englishRun("दो words ही")).toBeNull();
});
