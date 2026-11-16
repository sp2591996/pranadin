# Security notes (E-14)
Owner: Developer 1 · 2026-11-17 · Implements ADR-011.

## Headers (`vercel.json`, all paths)
| Header | Value / reason |
|---|---|
| Content-Security-Policy | `default-src 'self'`, no third-party script, style, font or connect origins; `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`. `script-src` keeps `'unsafe-inline'` only as a backstop (see below). |
| Strict-Transport-Security | 2 years, includeSubDomains (no `preload`: we don't own the domain) |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY (older browsers; CSP covers the rest) |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera, microphone, payment, usb, FLoC/Topics off; `geolocation=(self)` kept for a possible on-device "use my location" |
| COOP / CORP | same-origin |

## Strict script CSP without a server
Next's static HTML contains inline bootstrap scripts, so a header-only CSP would need `'unsafe-inline'`. After `next build`, `scripts/csp-hash.mjs` hashes every inline script in each `out/**/*.html` and writes a per-page `<meta http-equiv="Content-Security-Policy">` with `script-src 'self' 'sha256-…'`. Browsers enforce **both** policies, so the effective script policy is the strict, hash-based one. The script fails the build if it finds an inline event handler (`on*=`).

## Dependencies
- `npm run audit:prod` (CI): **0 vulnerabilities** in production dependencies (next, react, react-dom, idb, @phosphor-icons/react).
- Dev-only: 7 moderate (minimatch ReDoS via typescript-eslint). Not shipped to users; revisit when typescript-eslint updates. sharp was bumped to 0.35.5 to clear a high libvips advisory (sharp only generates icons locally).
- Fonts are self-hosted at build time by `next/font`; icons are inlined SVG. No CDN calls at runtime.

## Open items
- **Analytics (Dev-2, Umami):** the CSP allows `connect-src 'self'` only. Once Legal approves the tool (Privacy Notice ⟦analytics tool⟧), add its exact origin to `connect-src` in both `vercel.json` and `BASE` in `scripts/csp-hash.mjs`. Until then the browser blocks the request, which matches "off unless you turn it on".
- Feedback form origin: same, once the PMO chooses it (D-022).
- Verify headers on the first Vercel preview with securityheaders.com or `curl -I`.
