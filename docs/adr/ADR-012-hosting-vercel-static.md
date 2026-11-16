# ADR-012: Host the static export on Vercel (free), no custom domain
Owner: Developer 1 · Status: Accepted (implements Board D-009 as amended) · Date: 2026-11-17
Supersedes: ADR-004 (Cloudflare Pages) in `14_Engineering/adr/`.

## Context
D-009 approved a fresh, no-backend, installable web app, and the Board amended the hosting choice to **Vercel free with its platform subdomain**. ADR-003 (Next.js static export) still holds. ADR-004's `_headers`/`_redirects` approach is Cloudflare-specific.

## Decision
- Next.js `output: "export"` with `trailingSlash: true` builds plain files into `out/`. Vercel serves them with `framework: null`, so no Vercel Functions, ISR or image optimisation run (₹0, no server code).
- `vercel.json` holds the build command (`npm run build`), the output directory and all security headers (see `docs/security.md`). `/_next/static/*` is cached for a year, immutable.
- CI (`.github/workflows/ci.yml`) gates lint, typecheck, tests, build and the prod-dependency audit. Vercel's Git integration builds previews and production once the Board links an account. **No deploy was done here.**

## Consequences
- **Licence risk, carried from ADR-004:** Vercel Hobby is for non-commercial use under its fair-use guidelines. The beta has no ads or payments, but if PranaDin becomes commercial, move to Vercel Pro or another host. The app is portable: `out/` is plain static files, and only `vercel.json` headers would need porting.
- 404s use `src/app/global-not-found.tsx` (exported as `404.html`, which Vercel serves automatically).
- A non-matching Vercel project setting (for example framework preset "Next.js") would ignore `outputDirectory`. Keep the preset at "Other".
