# Nazmus Sakib AI Portfolio — Senior Engineering Audit

**Audit type:** Read-only publish-readiness review  
**Target publishing window:** October–November 2026  
**Scope:** Architecture, data flow, CMS, UX, accessibility, animation, performance, security, SEO, testing, deployment, and graduate-recruiter impact.  
**Code changes applied during this audit:** None.

## Executive verdict

The portfolio is already a strong visual showcase with a clear AI-engineering identity. It has meaningful technical depth in Hirelay and SentimentScope, a database-backed CMS, a functioning Medium synchronization flow, progressive disclosure for writings, certificate categories, Admin ordering, case-study deep links, and a distinctive interaction layer.

The project is **not yet release-ready from an engineering-operations perspective**, even though the type check and production build succeed. The main risks are reproducible deployment, lint/test quality gates, production security hardening, large initial client payload, and route-specific SEO. These are solvable and should be addressed before publishing. No major new visual feature is necessary before those foundations are complete.

> **Senior recommendation:** Freeze the visual feature set temporarily. Resolve the P0 release blockers first, then perform one focused accessibility/performance pass, and only after that add small, evidence-driven enhancements.

## Scorecard

| Area | Current assessment | Publish impact |
|---|---|---|
| Visual identity | Strong and memorable; dark navy, gold, cyan, AI-console treatment is coherent | Strength |
| Technical storytelling | Strong foundation; flagship case studies are the right direction | Strength |
| CMS/data model | Good coverage of ordering, visibility, featured content, categories, and Medium sync | Strength with migration risk |
| Type safety | `pnpm run check` passes with strict TypeScript settings | Strength |
| Production build | `pnpm run build` passes | Strength |
| Lint quality | Fails with 38 findings: 34 errors and 4 warnings | P0 before release |
| Automated tests | `pnpm run test` fails because no test files are discovered | P0 before release |
| Database migrations | Journal and filenames are inconsistent; SQL migrations are ignored by `.gitignore` | P0 deployment blocker |
| Security headers | Basic headers exist, but CSP and Permissions-Policy are absent | P1 hardening |
| Media storage | Uploads are stored as Base64 blobs in MySQL | P1 scalability/security concern |
| Performance | Initial JS bundle is approximately 979 kB minified / 286 kB gzip; several global animation systems are always mounted | P1 optimization |
| SEO/social | Homepage metadata is strong; robots/sitemap and case-study-specific metadata are missing | P1 discoverability |
| Accessibility | Many controls have labels and focus styles, but modal focus management and reduced-motion coverage need a formal pass | P1 quality |
| Recruiter conversion | Good project and contact foundation; needs a tighter graduate-ready narrative after graduation | P1 content polish |

## P0 — Resolve before public launch

### 1. Make the migration history reproducible

The repository contains `0000_silly_boomer.sql`, two files beginning with `0001`, `0002_project_case_studies.sql`, and `0003_project_video_url.sql`. However, `db/migrations/meta/_journal.json` records only the `0000` and `0001_overconfident_vapor` entries. The project’s `.gitignore` also ignores `db/migrations/*.sql`. The folder is not currently a Git repository, so there is no versioned rollback trail or verified deployment history.

This is the highest-risk issue because a fresh production database may not receive the same schema as the local MariaDB instance. Before publishing, consolidate the migration history into one authoritative sequence, regenerate snapshots/journal from a clean baseline, remove the blanket SQL-migration ignore rule, and verify the complete sequence against an empty database. Keep a backup and a rollback plan before applying it to the real database.

**Evidence:** `db/migrations/meta/_journal.json`, `db/migrations/`, `.gitignore`, and the absence of a Git worktree during the audit.

### 2. Do not publish with failing lint and zero automated tests

`pnpm run check` and `pnpm run build` pass, but `pnpm run lint` fails with 38 findings. The rule-level summary is:

| Rule | Count | Main implication |
|---|---:|---|
| `react-hooks/set-state-in-effect` | 13 | Possible cascading renders and fragile effect-driven state |
| `react-refresh/only-export-components` | 10 | Fast Refresh boundaries are not clean |
| `no-useless-escape` | 4 | Small code-quality issue in HTML escaping |
| `react-hooks/exhaustive-deps` | 4 | Effects may observe stale or unstable dependencies |
| `@typescript-eslint/no-unused-vars` | 3 | Dead or unfinished code paths |
| `@typescript-eslint/no-explicit-any` | 2 | Weakens server-side type guarantees |
| `react-hooks/purity` | 1 | Render-time purity concern |
| `react-hooks/static-components` | 1 | Component is created inside render |

`pnpm run test` exits with failure because no matching test files exist under the configured `api/**/*.test.ts` and `api/**/*.spec.ts` patterns. At minimum, add tests for admin login/rate limiting, contact validation, Medium URL canonicalization/deduplication, writing visibility/featured rules, certificate ordering, and case-study parsing. Add one browser-level smoke test for homepage load, case-study back navigation, Admin login, and the Blog Read More flow.

### 3. Close the bootstrap-password risk in every non-production environment

`getBootstrapPassword()` returns the configured `ADMIN_PASSWORD`, but falls back to `nazmus-admin-2026` whenever `NODE_ENV` is not `production`. This is convenient for local development but unsafe for a publicly reachable staging environment. Make staging fail closed unless an explicit password is configured, or gate the fallback behind a separate unmistakable local-only flag and bind development servers to localhost.

The first production login should also be documented as a one-time bootstrap process, followed by an immediate password change and session revocation.

**Evidence:** `api/lib/admin-auth.ts:118-122`, `api/routers/admin.ts:39-57`.

## P1 — Complete before or immediately after launch

### 4. Reduce the initial client payload and global work

The production build produces an approximately **978.5 kB minified JavaScript asset** and **134 kB CSS asset**. The homepage mounts nearly every public section and all global effects at once: Lenis, GSAP/ScrollTrigger, the Hero particle canvas, CustomCursor particles, ScrollProgress, Xervis, SocialActivity, CV, and all content sections. The Hero canvas repaints the full viewport every frame and performs pairwise particle-distance checks.

Recommended sequence:

1. Lazy-load Admin, CaseStudy, and heavy non-hero routes.
2. Split the Admin bundle from the public bundle.
3. Defer SocialActivity, Xervis, CV preview internals, and below-the-fold media until needed.
4. Disable or reduce canvas, pointer particles, and blur-heavy effects on low-power/mobile devices.
5. Measure Core Web Vitals on a mid-range Android device rather than relying only on desktop localhost.
6. Add a bundle-size budget to CI so future visual additions cannot silently increase the first load.

The visual result is good, but the portfolio should feel immediate to a recruiter on a slower connection. A fast, quiet first paint is more valuable than another decorative layer.

**Evidence:** `src/pages/Home.tsx:40-60`, `src/sections/Hero.tsx:10-129`, `src/components/fx/CustomCursor.tsx`, `src/components/fx/SmoothScroll.tsx`, and the production build output.

### 5. Move uploaded media out of MySQL Base64 storage

The `uploads` table stores the entire Base64 payload in a `longtext` column. The upload API accepts images, GIFs, PDFs, and SVG, with a large request limit. This increases database size, backup time, query memory, and deployment cost. SVG is accepted based on the submitted MIME type, which is not sufficient content validation by itself.

For a public deployment, use object storage such as S3-compatible storage, store only metadata and a stable object key in MySQL, validate actual file signatures, normalize image dimensions, and consider disallowing SVG unless it is sanitized. Add a cleanup policy for orphaned uploads and a backup/restore test.

**Evidence:** `db/schema.ts:275-283`, `api/routers/upload.ts`, `api/lib/files.ts`, `api/boot.ts:25`.

### 6. Harden public endpoints against distributed abuse

Contact and Xervis rate limits are module-scoped in-memory maps. They work for a single local process but reset on restart and do not coordinate across multiple production instances. The code also trusts forwarded IP headers without an explicit trusted-proxy configuration.

Before launch, use an edge/proxy rate limit or shared store, configure trusted proxy behavior, cap request/body sizes per endpoint, and add monitoring for contact spam and AI-provider usage. For Xervis, enforce a daily/monthly provider budget and consider a stronger per-IP plus per-session limit. For the contact form, keep the honeypot and add a lightweight challenge only if spam appears in real traffic.

**Evidence:** `api/routers/contact.ts:9-27`, `api/routers/assistant.ts:8-13`, `api/routers/assistant.ts:228-282`.

### 7. Add a real production security baseline

The server currently sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and production HSTS. It does not set a Content-Security-Policy or Permissions-Policy. A focused CSP should be introduced after enumerating the actual external sources used by Medium, GitHub, Resend, AI providers, fonts, and media. Add `Permissions-Policy` to disable unused browser capabilities, and verify cookie behavior behind the production proxy.

The admin session design is otherwise a solid base: HttpOnly cookies, secure production cookies, hashed session tokens, scrypt password hashing, timing-safe comparisons, and login/reset rate limits.

**Evidence:** `api/boot.ts:15-23`, `api/lib/admin-auth.ts`, `api/routers/admin-middleware.ts:19-79`.

### 8. Make scheduled Medium sync safe for multiple instances

Production startup runs Medium synchronization immediately and then uses `setInterval` every six hours in the same Node process. This is acceptable for one long-lived instance, but multiple replicas would run duplicate sync jobs. Add a distributed lock, a separate scheduled job, or a database lease. Record the last successful sync, last failure, number of created/updated/deduplicated rows, and feed URL in an Admin-visible status panel.

### 9. Finish route-specific SEO

The homepage has Open Graph, Twitter/X, canonical, favicon, theme color, and JSON-LD support. However, requests to `/robots.txt` and `/sitemap.xml` currently return the SPA HTML rather than dedicated SEO files. Add both files with the real production origin and include the homepage and published case-study URLs.

The case-study route also needs its own title, description, canonical URL, Open Graph image, and JSON-LD. At present, the runtime metadata helper is initialized in `main.tsx`, while `Home.tsx` only updates the homepage title/description. A recruiter sharing a Hirelay case-study link should see Hirelay-specific metadata, not only the portfolio homepage metadata.

### 10. Formalize accessibility before launch

The portfolio already has useful labels, alt text in several image components, visible focus rings in important controls, and reduced-motion handling in Lenis and the preloader. The audit still recommends a formal pass for:

- `role="dialog"`, `aria-modal`, labelled headings, Escape-to-close, focus trapping, and focus restoration for project and certificate lightboxes.
- `aria-current` and a clear active state on public section navigation.
- Keyboard access and visible focus for every filter chip, horizontal gallery control, and custom cursor-related interactive element.
- Contrast checks for low-opacity gray text, especially on glass surfaces.
- A reduced-motion path for the Hero canvas and all cursor particle emission, not only CSS animations and Lenis.
- Testing at 200% zoom and with a screen reader on the contact form and Admin CMS.

### 11. Resolve the remaining section-restoration edge case

The public Navigation effect depends on a freshly constructed `navItems` array and derives the active section from scroll position. Projects also owns a transient session-storage restoration flow. This is fragile around browser tab switching, settings-driven visibility changes, Lenis timing, and stale history state. The reported Awards-to-Projects return behavior should be treated as an open P1 until it is tested with: tab switch, browser back/forward, hard reload, direct hash navigation, hidden/visible section settings, and mobile drawer navigation.

A more durable design would centralize section state, memoize navigation items, use an IntersectionObserver for active-section detection, and store a short-lived return token containing the source section rather than a Projects-specific marker.

**Evidence:** `src/sections/Navigation.tsx:45-69`, `src/sections/Projects.tsx:55-95`, `src/hooks/useSettings.ts:61-87`.

## P2 — Recommended polish after the foundation is stable

### 12. Update the graduate narrative at the right moment

The current public copy says that Nazmus is a 24-year-old final-semester student and presents current internships. Before publishing in October–November, update this copy based on the real graduation date. After graduation, replace semester-specific language with a durable early-career statement such as “Early-career ML Engineer building production-minded AI systems.” Keep the strongest evidence: shipped systems, role, measurable outcomes, repositories, and verified links.

Avoid making the reader infer availability. Keep one primary recruiter CTA visible near the Hero and repeat it once after the strongest case study.

### 13. Improve technical proof, not animation volume

Hirelay and SentimentScope are the strongest assets. The next useful content addition is not another project card; it is one concise evidence block per flagship project containing architecture diagram, role, constraints, one measured result, one trade-off, and a working link. Every metric should distinguish measured, observed, and planned values.

The current case-study structure is directionally correct and appropriately evidence-led. Preserve that standard for future projects.

### 14. Keep the pointer system restrained and adaptive

The pointer field and detached particle bursts are distinctive, but the Hero already contains a particle canvas, floating technology cards, scanlines, magnetic CTAs, card tilt, Xervis, and a persistent status bar. Do not add more animation layers before performance testing.

Recommended animation policy:

| Context | Recommendation |
|---|---|
| Desktop fine pointer | Keep the current particle burst, but cap density and use a short lifetime |
| Touch/mobile | Disable custom cursor, reduce Hero canvas density, preserve simple card transitions |
| Reduced motion | Disable canvas movement, pointer particles, card tilt, marquee, and nonessential bounce |
| Low-power/slow device | Prefer a static glow and CSS hover over canvas and GSAP effects |
| Recruiter reading case study | Prioritize stable text and image rendering over decorative motion |

### 15. Make certificate and writing discovery measurable and obvious

The certificate category filters and Blog Read More behavior solve the density problem well. Add a small result count, preserve filter state in the URL only if sharing filtered views is useful, and ensure horizontal certificate controls are discoverable on keyboard and touch. For writings, keep new Medium posts hidden until approved and make the Admin status explicit.

### 16. Replace stock project documentation and add operational basics

`README.md` is still the stock Vite template. Replace it with portfolio-specific documentation covering architecture, environment variables, database setup, migrations, seeding, Admin bootstrap, Medium sync, media storage, local development, test commands, deployment, backup/restore, and incident recovery. Add a `/health` endpoint that checks application readiness without exposing secrets, plus structured server logs with request identifiers.

Keep only one package manager lockfile. The project currently contains both `package-lock.json` and `pnpm-lock.yaml`; standardize on pnpm because the scripts and recent validation use pnpm.

## Suggested release plan

### Before publishing

1. Fix migration/journal/version-control hygiene.
2. Make lint pass and add a small backend plus browser smoke-test suite.
3. Remove or strictly gate the non-production bootstrap password.
4. Add robots, sitemap, case-study metadata, CSP, Permissions-Policy, and a health check.
5. Test the full flow on a clean database and a production-like environment.
6. Reconfirm all claims, dates, internship labels, links, CV, and public contact address.

### First polish pass after the blockers

1. Split the Admin and case-study bundles.
2. Reduce below-the-fold and low-power animation work.
3. Complete modal focus/accessibility testing.
4. Add sync observability and a distributed lock if more than one server instance is possible.
5. Move media to object storage if the site will receive regular CMS updates.

### Later improvements

1. Add privacy-respecting analytics for CTA clicks, case-study opens, CV preview/download, and contact submissions.
2. Add a small recruiter-focused “Selected impact” summary near the Hero.
3. Add project demo videos only where they explain behavior better than screenshots.
4. Continue publishing technical writing, but keep the public Blog progressive and curated.

## Final assessment

The portfolio has enough substance to represent Nazmus Sakib professionally as a fresh graduate. Its best differentiator is the combination of applied AI systems, bilingual NLP, full-stack delivery, automation, and evidence-oriented case studies. The remaining work is mostly engineering discipline and release hygiene rather than a need for more visual spectacle.

**Recommended decision:** Do not add major new features now. Approve a focused hardening sprint covering migration reproducibility, lint/tests, security, SEO, performance, accessibility, and graduation-date content updates. After those are complete, the portfolio will be in a much stronger position for recruiters, freelance clients, and technical reviewers.

## Evidence index

1. `package.json` — scripts and dependency surface.
2. `db/schema.ts` — content, auth, contact, and upload data model.
3. `db/migrations/meta/_journal.json` and `db/migrations/` — migration reproducibility.
4. `.gitignore` — migration SQL exclusion and environment hygiene.
5. `src/pages/Home.tsx` — homepage composition and global mounts.
6. `src/sections/Hero.tsx` — Hero canvas and animation cost center.
7. `src/components/fx/CustomCursor.tsx`, `SmoothScroll.tsx`, `Preloader.tsx` — pointer, scroll, and loading effects.
8. `api/boot.ts` — production serving, headers, body limit, and scheduled sync.
9. `api/lib/admin-auth.ts`, `api/routers/admin.ts`, `api/routers/admin-middleware.ts` — Admin security.
10. `api/routers/contact.ts`, `api/routers/assistant.ts`, `api/routers/upload.ts` — public endpoint abuse and media handling.
11. `src/sections/Navigation.tsx`, `src/sections/Projects.tsx`, `src/hooks/useSettings.ts` — section tracking and restoration.
12. `index.html`, `src/main.tsx`, and public asset directory — social metadata and crawlability.
13. Validation executed during audit: `pnpm run check` passed; `pnpm run build` passed; `pnpm run lint` failed with 38 findings; `pnpm run test` failed because no test files were discovered; `pnpm audit --prod --audit-level=high` reported no known vulnerabilities.

## References

This report is based on the project files and commands listed in the evidence index. No code or configuration changes were made during the audit.
