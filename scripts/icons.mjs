#!/usr/bin/env node
// PNG icons from Design's SVGs (13_Design/brand, copied to app/brand/). Run: node scripts/icons.mjs
import { mkdirSync } from "node:fs";
import sharp from "sharp";

mkdirSync("public/icons", { recursive: true });
const jobs = [
  ["brand/icon-any.svg", "public/icons/icon-192.png", 192],
  ["brand/icon-any.svg", "public/icons/icon-512.png", 512],
  ["brand/icon-maskable.svg", "public/icons/maskable-192.png", 192],
  ["brand/icon-maskable.svg", "public/icons/maskable-512.png", 512],
  ["brand/icon-monochrome.svg", "public/icons/monochrome-512.png", 512],
  ["brand/apple-touch-icon.svg", "public/icons/apple-touch-icon.png", 180],
  ["brand/favicon.svg", "public/icons/favicon-32.png", 32],
];
for (const [src, out, size] of jobs) {
  await sharp(src, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toFile(out);
}
console.log(`[icons] ${jobs.length} PNGs written`);
