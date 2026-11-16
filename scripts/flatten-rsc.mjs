#!/usr/bin/env node
/**
 * Post-build fix for Next 16 static export + segment prefetching.
 *
 * `next build` writes deep segment prefetch files as nested folders, e.g.
 *   out/en/today/__next.$d$locale/!KHRhYnMp/today/__PAGE__.txt
 * but the client router requests the dot-joined name
 *   /en/today/__next.$d$locale.!KHRhYnMp.today.__PAGE__.txt
 * (the same form Next already uses one level up: `__next.$d$locale.txt`).
 * On a plain static host those requests 404, so every link prefetch logs
 * console errors and falls back to a slower fetch. This copies each nested
 * file to its dot-joined name next to the folder. Originals are kept.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "out");
let copied = 0;

function walkFiles(dir, rel = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, [...rel, e.name]);
    else visit(p, [...rel, e.name]);
  }
}

let current = null;
function visit(file, rel) {
  const flat = path.join(path.dirname(current), [path.basename(current), ...rel].join("."));
  if (!fs.existsSync(flat)) {
    fs.copyFileSync(file, flat);
    copied++;
  }
}

function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    if (e.name.startsWith("__next.")) {
      current = p;
      walkFiles(p);
    } else if (e.name !== "_next") {
      scan(p);
    }
  }
}

if (!fs.existsSync(OUT)) throw new Error("flatten-rsc: run after `next build` (out/ missing)");
scan(OUT);
console.log(`[flatten-rsc] ${copied} segment files copied to dot-joined names`);
