#!/usr/bin/env node
/**
 * First-load JS budget (PRD NFR: 170 KB gzip). For every exported page,
 * sums the gzip size of the external scripts a modern browser downloads.
 * `noModule` scripts (Next's legacy polyfills) are excluded: browsers that
 * support ES modules skip them. Inline RSC payload is reported separately.
 *
 *   node scripts/js-budget.mjs          report and fail over budget
 *   node scripts/js-budget.mjs --list   also list each page
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const BUDGET_KB = 170;
const OUT = path.resolve(import.meta.dirname, "..", "out");
const list = process.argv.includes("--list");
const gz = (b) => zlib.gzipSync(b, { level: 9 }).length / 1024;
const cache = new Map();

function pages(dir) {
  const found = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== "_next") found.push(...pages(p));
    else if (e.name === "index.html") found.push(p);
  }
  return found;
}

const rows = pages(OUT).map((file) => {
  const html = fs.readFileSync(file, "utf8");
  const srcs = new Set();
  for (const m of html.matchAll(/<script\b([^>]*)>/g)) {
    const attrs = m[1];
    const src = /\bsrc="([^"]+)"/.exec(attrs)?.[1];
    if (src && !/\bnoModule\b/i.test(attrs)) srcs.add(src.split("?")[0]);
  }
  let js = 0;
  for (const s of srcs) {
    if (!cache.has(s)) cache.set(s, gz(fs.readFileSync(path.join(OUT, s))));
    js += cache.get(s);
  }
  const inline = gz(Buffer.from([...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("")));
  return { page: "/" + path.relative(OUT, path.dirname(file)).replaceAll("\\", "/"), js, inline };
});

rows.sort((a, b) => b.js - a.js);
if (list) for (const r of rows) console.log(`${r.js.toFixed(1).padStart(6)} KB  (+${r.inline.toFixed(1)} inline)  ${r.page}`);
const worst = rows[0];
console.log(`[js-budget] heaviest page ${worst.page}: ${worst.js.toFixed(1)} KB gzip first-load JS (budget ${BUDGET_KB} KB), +${worst.inline.toFixed(1)} KB inline payload`);
if (worst.js > BUDGET_KB) {
  console.error(`[js-budget] over budget by ${(worst.js - BUDGET_KB).toFixed(1)} KB`);
  process.exit(1);
}
