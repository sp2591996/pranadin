import "fake-indexeddb/auto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseCredits } from "@/lib/audio-credits";
import { AUDIO_CATEGORIES, TRACKS, trackById, tracksIn, usedCategories } from "@/lib/audio-manifest";
import { __resetStorageForTests } from "@/lib/storage";
import { BEADS_PER_MALA, loadCount, MAX_COUNT, sanitize, saveCount, tap, view } from "./japa";
import { GENERATED, SCENES, sceneIsValid } from "./scenes";

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

describe("japa counter", () => {
  it("counts one bead per tap and reports malas", () => {
    expect(view(0)).toEqual({ beads: 0, malas: 0, total: 0 });
    expect(view(5)).toEqual({ beads: 5, malas: 0, total: 5 });
    expect(view(108)).toEqual({ beads: 0, malas: 1, total: 108 });
    expect(view(230)).toEqual({ beads: 14, malas: 2, total: 230 });
  });

  it("completes a mala on the 108th bead only", () => {
    let c = 0;
    let completions = 0;
    for (let i = 0; i < BEADS_PER_MALA * 2; i++) {
      const r = tap(c);
      c = r.count;
      if (r.completed) {
        completions++;
        expect(c % BEADS_PER_MALA).toBe(0);
      }
    }
    expect(completions).toBe(2);
    expect(tap(107)).toEqual({ count: 108, completed: true });
    expect(tap(108).completed).toBe(false);
  });

  it("never goes negative or past the cap, and ignores garbage", () => {
    expect(sanitize(-4)).toBe(0);
    expect(sanitize(NaN)).toBe(0);
    expect(sanitize("7")).toBe(0);
    expect(sanitize(3.9)).toBe(3);
    expect(tap(MAX_COUNT).count).toBe(MAX_COUNT);
  });

  it("saves and reloads the count on the device, and a reset to 0 sticks", async () => {
    __resetStorageForTests();
    expect((await loadCount()).count).toBe(0);
    await saveCount(57);
    __resetStorageForTests();
    expect((await loadCount()).count).toBe(57);
    await saveCount(0);
    __resetStorageForTests();
    expect((await loadCount()).count).toBe(0);
  });
});

describe("audio manifest", () => {
  it("has unique ids and files, in known categories", () => {
    expect(new Set(TRACKS.map((t) => t.id)).size).toBe(TRACKS.length);
    expect(new Set(TRACKS.map((t) => t.file)).size).toBe(TRACKS.length);
    for (const t of TRACKS) {
      expect(AUDIO_CATEGORIES).toContain(t.category);
      expect(t.file.startsWith(`${t.category}/`), t.file).toBe(true);
      expect(GENERATED as readonly string[]).not.toContain(t.id);
    }
  });

  it("lists exactly the files present in public/audio", () => {
    const onDisk = AUDIO_CATEGORIES.flatMap((c) => {
      const dir = path.join(AUDIO_DIR, c);
      return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(mp3|ogg|m4a|wav)$/i.test(f)).map((f) => `${c}/${f}`) : [];
    });
    expect(TRACKS.map((t) => t.file).sort()).toEqual(onDisk.sort());
  });

  it("has a credits row for every file, and none for a missing file", () => {
    const credits = parseCredits(fs.readFileSync(path.join(AUDIO_DIR, "CREDITS.md"), "utf8"));
    expect(credits.map((c) => c.file).sort()).toEqual(TRACKS.map((t) => t.file).sort());
    for (const c of credits) {
      expect(c.title, c.file).not.toBe("");
      expect(c.author, c.file).not.toBe("");
      expect(c.licence, c.file).not.toBe("");
      const track = TRACKS.find((t) => t.file === c.file);
      // AI voices (D-027) are made for the app, so they have no source page; every recording has one.
      expect(c.aiGenerated, c.file).toBe(track?.ai === true);
      if (!c.aiGenerated) expect(c.link, c.file).toMatch(/^https:\/\//);
    }
  });

  it("looks tracks up and groups them", () => {
    expect(trackById("rain")?.mode).toBe("loop");
    expect(trackById("nope")).toBeUndefined();
    expect(tracksIn("nature").map((t) => t.id)).toEqual(["rain", "fire", "wind"]);
    expect(usedCategories()).toEqual(["nature", "temple", "mantras"]);
  });

  it("loops the nature files and plays the temple files once", () => {
    for (const t of tracksIn("nature")) expect(t.mode).toBe("loop");
    for (const t of tracksIn("temple")) expect(t.mode).toBe("once");
  });
});

describe("scenes", () => {
  it("layer 2 to 3 known sounds each", () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(3);
    for (const s of SCENES) {
      expect(sceneIsValid(s), s.id).toBe(true);
      expect(s.layers.length).toBeGreaterThanOrEqual(2);
      for (const l of s.layers) expect(l.volume).toBeGreaterThan(0);
    }
  });
});

describe("credits parser", () => {
  const md = [
    "| File in app | Source title | Author | Licence | Source page | Note |",
    "|---|---|---|---|---|---|",
    "| a/x.mp3 | X | Ann | CC0 | https://example.org/x | plain |",
    "| a/y.mp3 | Y | Bo | CC BY | not a link | AI-generated voice |",
  ].join("\r\n");
  it("reads rows, drops non-https links and flags AI-generated audio", () => {
    const r = parseCredits(md);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ file: "a/x.mp3", author: "Ann", link: "https://example.org/x", aiGenerated: false });
    expect(r[1]).toMatchObject({ link: null, aiGenerated: true });
  });
  it("returns nothing for text without a table", () => {
    expect(parseCredits("# hi")).toEqual([]);
  });
});

describe("CSP", () => {
  it("allows same-origin media in the header policy", () => {
    const v = JSON.parse(fs.readFileSync("vercel.json", "utf8")) as { headers: { headers: { key: string; value: string }[] }[] };
    const csp = v.headers[0]!.headers.find((h) => h.key === "Content-Security-Policy")!.value;
    expect(csp).toMatch(/media-src 'self'/);
    expect(csp).toMatch(/connect-src 'self'/);
  });
  it("allows same-origin media in the per-page meta policy", () => {
    expect(fs.readFileSync("scripts/csp-hash.mjs", "utf8")).toMatch(/"media-src": \["'self'"/);
  });
});
