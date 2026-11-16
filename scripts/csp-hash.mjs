#!/usr/bin/env node
/**
 * Post-build CSP hardening (E-14, ADR-011).
 *
 * Next.js static export writes small inline <script> blocks (the RSC payload
 * and bootstrap) that differ per page and per build, so a nonce is impossible
 * and one global list of hashes would be fragile. This script walks `out/`,
 * hashes every inline script in each HTML file, and inserts a per-page
 * <meta http-equiv="Content-Security-Policy"> as the first child of <head>
 * that allows only `'self'` plus exactly those hashes.
 *
 * Browsers enforce the header CSP (vercel.json) AND this meta CSP; a script
 * must pass both. The header keeps 'unsafe-inline' only as the backstop for
 * this meta policy; `frame-ancestors` and reporting cannot be set in meta,
 * so they stay in the header.
 *
 * Plain Node, no dependencies, works on Windows and Linux.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const OUT = join(process.cwd(), "out");

/** Keep in sync with the header policy in vercel.json (minus frame-ancestors). */
const BASE = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'"],
  "connect-src": ["'self'"],
  "media-src": ["'self'", "blob:"],
  "worker-src": ["'self'"],
  "manifest-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
};

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });
}

const SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const m of html.matchAll(SCRIPT_RE)) {
    const attrs = m[1];
    const body = m[2];
    if (/\bsrc\s*=/.test(attrs) || body.length === 0) continue;
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1]?.toLowerCase();
    if (type && type !== "text/javascript" && type !== "module" && type !== "application/javascript") continue;
    hashes.add(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
  }
  return [...hashes];
}

function policy(hashes) {
  const p = { ...BASE, "script-src": [...BASE["script-src"], ...hashes] };
  return Object.entries(p)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
}

let files = 0;
let total = 0;
for (const file of walk(OUT)) {
  let html = readFileSync(file, "utf8");
  if (html.includes('http-equiv="Content-Security-Policy"')) continue; // idempotent
  const headAt = html.search(/<head[^>]*>/i);
  if (headAt < 0) throw new Error(`${relative(OUT, file)}: no <head>`);
  const hashes = inlineScriptHashes(html);
  // Inline event handlers (onclick=...) cannot be hashed; fail loudly.
  if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(html.replace(SCRIPT_RE, ""))) {
    throw new Error(`${relative(OUT, file)}: inline event handler found; CSP would block it`);
  }
  const headEnd = html.indexOf(">", headAt) + 1;
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy(hashes)}"/>`;
  html = html.slice(0, headEnd) + meta + html.slice(headEnd);
  writeFileSync(file, html);
  files++;
  total += hashes.length;
}
console.log(`[csp-hash] ${files} HTML files, ${total} inline script hashes`);
