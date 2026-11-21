// Lists every English content item that has no Hindi/Marathi text yet (D-030).
// Usage: node scripts/content-gaps.mjs [--json out.json]
import fs from "node:fs";
import path from "node:path";
const C = path.join(process.cwd(), "content");
const rd = (rel) => { const f = path.join(C, rel); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "")) : null; };
const has = (v) => (typeof v === "string" ? v.trim() !== "" : !!v && typeof v.text === "string" && v.text.trim() !== "");
const gaps = { hi: {}, mr: {} };
const add = (l, file, id, en) => ((gaps[l][file] ??= {})[id] = en);
const fb = fs.readFileSync(path.join(process.cwd(), "src/features/shared/fallback-strings.ts"), "utf8");
const fallback = Object.fromEntries([...fb.matchAll(/^ *"([^"]+)": *"(.*)", *$/gm)].map((m) => [m[1], JSON.parse(`"${m[2]}"`)]));
const sameAsEn = (en, tr) => typeof en === "string" && typeof tr === "string" && /[A-Za-z]{4,} [A-Za-z]{3,} [A-Za-z]{3,}/.test(tr);
for (const l of ["hi", "mr"]) {
  // ui
  const en = rd("en/ui.json").strings, tr = rd(`${l}/ui.json`)?.strings ?? {};
  for (const [k, v] of Object.entries({ ...fallback, ...en })) if (!has(tr[k]) || sameAsEn(v, tr[k]?.text)) add(l, "ui.json", k, v);
  // observances
  const eo = rd("en/observances.json").items, to = rd(`${l}/observances.json`)?.items ?? {};
  for (const [k, v] of Object.entries(eo)) {
    const t = to[k];
    if (!has(t?.name)) add(l, "observances.json#name", k, v.name);
    if (!has(t?.note) || t.noteLang === "en" || t.note === v.note) add(l, "observances.json#note", k, v.note);
  }
  // practices
  const ep = rd("en/practices.json"), tp = rd(`${l}/practices.json`) ?? {};
  for (const sec of ["techniques", "meditations"]) for (const [id, it] of Object.entries(ep[sec] ?? {})) {
    for (const [f, v] of Object.entries(it)) {
      const t = tp[sec]?.[id]?.[f];
      const ok = Array.isArray(v) ? Array.isArray(t) && t.length === v.length && t.every(has) : has(t);
      if (!ok) add(l, `practices.json#${sec}`, `${id}.${f}`, v);
    }
  }
  // plan cards
  const ec = rd("en/plan-cards.json").cards, tc = rd(`${l}/plan-cards.json`)?.cards ?? {};
  for (const [k, v] of Object.entries(ec)) for (const f of ["title", "body"]) if (!has(tc[k]?.[f])) add(l, "plan-cards.json", `${k}.${f}`, v[f]);
  // journal
  const ej = rd("en/journal.json"), tj = rd(`${l}/journal.json`) ?? {};
  for (const [k, v] of Object.entries(ej.prompts)) if (!has(tj.prompts?.[k])) add(l, "journal.json#prompts", k, v);
  for (const [k, v] of Object.entries(ej.moods)) for (const f of ["label", "a11y"]) if (!has(tj.moods?.[k]?.[f])) add(l, "journal.json#moods", `${k}.${f}`, v[f]);
  // yoga
  const ey = rd("en/yoga.json"), ty = rd(`${l}/yoga.json`) ?? {};
  const chk = (file, id, en, tr) => {
    for (const [f, v] of Object.entries(en)) {
      if (["id", "slug", "level", "category", "image", "sanskrit", "transliteration", "holdSeconds", "seconds", "pose", "module", "day", "sources", "timeOfDay", "focus"].includes(f)) continue;
      const t = tr?.[f];
      const ok = Array.isArray(v) ? Array.isArray(t) && t.length === v.length && t.every((x, i) => (typeof v[i] === "string" ? has(x) : true)) : has(t);
      if (!ok) add(l, file, `${id}.${f}`, v);
    }
  };
  for (const p of ey.poses) chk("yoga.json#poses", p.slug, p, ty.poses?.[p.slug]);
  for (const m of ey.modules) {
    chk("yoga.json#modules", m.slug, { title: m.title, description: m.description }, ty.modules?.[m.slug]);
    m.steps.forEach((s, i) => chk("yoga.json#modules", `${m.slug}.steps.${i}`, { title: s.title, instruction: s.instruction, breath: s.breath }, ty.modules?.[m.slug]?.steps?.[i]));
  }
  for (const p of ey.programs) {
    chk("yoga.json#programs", p.id, { title: p.title, description: p.description }, ty.programs?.[p.id]);
    p.days.forEach((d, i) => chk("yoga.json#programs", `${p.id}.days.${i}`, { name: d.name }, ty.programs?.[p.id]?.days?.[i]));
  }
  // chakras / wisdom (inline)
  for (const [file, key] of [["chakras.json", "chakras"], ["wisdom.json", "verses"]]) {
    const f = rd(file);
    const chkLt = (id, o) => { if (o && typeof o === "object" && "en" in o && "hi" in o) { if (!has(o[l])) add(l, file, id, o.en); } };
    for (const [k, o] of Object.entries(f.ui)) chkLt(`ui.${k}`, o);
    for (const it of f[key]) for (const [k, o] of Object.entries(it)) chkLt(`${it.id}.${k}`, o);
  }
  // pages
  for (const slug of ["about", "ai-use", "corrections", "disclaimer", "sources", "privacy", "terms", "help"]) {
    const p = [`content/${l}/pages/${slug}.md`, `legal/${l}/${slug}.md`].map((x) => path.join(process.cwd(), x)).find((x) => fs.existsSync(x));
    if (!p) add(l, "pages", slug, "(missing page)");
  }
}
for (const l of ["hi", "mr"]) {
  let n = 0;
  console.log(`== ${l}`);
  for (const [f, o] of Object.entries(gaps[l])) { const c = Object.keys(o).length; n += c; console.log(`  ${f}: ${c}`); }
  console.log(`  TOTAL ${n}`);
}
const i = process.argv.indexOf("--json");
if (i > 0) fs.writeFileSync(process.argv[i + 1], JSON.stringify(gaps, null, 1));
