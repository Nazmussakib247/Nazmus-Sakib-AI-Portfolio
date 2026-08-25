# Nazmus Sakib AI Portfolio

A production-minded, CMS-driven AI engineering portfolio for **Nazmus Sakib**. The public site presents projects, case studies, experience, skills, awards, certificates, writing, CV information, public activity, and the Xervis AI assistant. Content is edited through a protected admin CMS and stored in PostgreSQL.

> All rights reserved by Nazmus Sakib.

## Product overview

This responsive React 19 portfolio uses a dark editorial interface with gold/violet interaction accents, motion-driven hero effects, searchable sections, case-study routes, CMS-driven SEO metadata, social preview images, and mobile-safe fixed controls. Production runs on a Node.js/Hono server on Render with Supabase PostgreSQL and the custom domain [nazmussakib.tech](https://nazmussakib.tech).

## Stack

| Layer | Technology | Responsibility |
|---|---|---|
| UI | React 19, TypeScript, Vite | Public portfolio and admin interfaces |
| Styling | Tailwind CSS and custom CSS | Responsive layout, design tokens, glass surfaces, motion |
| Interaction | GSAP, Lenis, Lucide | Hero animation, reveals, smooth scrolling, icons |
| API | tRPC 11 over Hono | Typed public and protected procedures |
| Data | PostgreSQL, Supabase, Drizzle ORM | CMS, settings, uploads, analytics, admin security |
| AI | Groq-backed Xervis | Portfolio Q&A and optional voice controls |
| Deployment | Render and GitHub | CI deployment, HTTPS, custom domain |

## Repository layout

```text
src/                 React pages, sections, components, hooks, and providers
  sections/          Hero, About, Projects, Experience, Skills, Awards,
                     Certificates, Blog, CV, Contact, Activity, Xervis, ticker
  pages/admin/       Protected CMS dashboard and content tabs
api/                 Hono server and tRPC routers
  boot.ts            Server entrypoint, security headers, API/static mounting
  context.ts         Request context and optional authenticated user
  router.ts          Root typed tRPC router
  routers/           Public and admin domain routers
db/                  Drizzle PostgreSQL schema, relations, seed, migrations
public/              Static browser assets
```

## Requirements and setup

Use Node.js 20+, pnpm 10+, PostgreSQL 14+, and Git.

```bash
git clone https://github.com/Nazmussakib247/Nazmus-Sakib-AI-Portfolio.git
cd Nazmus-Sakib-AI-Portfolio
pnpm install
```

Create `.env` locally and never commit it:

```dotenv
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
PORT=3000
NODE_ENV=development
# Add the authentication, storage, and AI variables required by deployment.
```

Run `pnpm run dev` and open `http://localhost:3000`. The CMS is at `/admin/login`. Do not reset or seed destructively against the hosted database.

## Commands

| Command | Purpose |
|---|---|
| `pnpm run dev` | Start the Vite/Hono development server |
| `pnpm run build` | Build browser assets and bundled Hono server |
| `pnpm run start` | Start the production server from `dist/` |
| `pnpm run check` | Run TypeScript validation |
| `pnpm run test` | Run the configured Vitest suite |
| `pnpm run db:generate` | Generate Drizzle SQL migrations |
| `pnpm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `pnpm run db:push` | Push schema for controlled development/deployment use |

## Runtime architecture

The browser renders React and calls the same-origin `/api/trpc` endpoint. Hono mounts tRPC, serves uploaded files through `/api/files/:id`, serves compiled assets in production, applies security headers, and runs the production Medium synchronization task. Drizzle maps the typed PostgreSQL schema to the CMS.

```text
Browser -> React/Vite -> /api/trpc -> Hono -> tRPC routers -> Drizzle -> Supabase PostgreSQL
                                      ├-> Xervis provider
                                      ├-> /api/files/:id
                                      └-> compiled production assets
```

## API reference

The source of truth is `api/router.ts` and the router files under `api/routers/`. The frontend uses the typed client from `src/providers/trpc.ts`; existing procedures should not be replaced with ad-hoc fetch wrappers.

| Namespace | Procedures | Access | Purpose |
|---|---|---|---|
| `ping` | `query` | Public | Health check returning `{ ok, ts }` |
| `profile` | `get` | Public | Public profile and links |
| `project` | `list`, `getBySlug` | Public | Projects, media, links, case studies |
| `experience` | `list` | Public | Ordered education/work/internship records |
| `skill` | `list` | Public | Ordered skills and categories |
| `award` | `list` | Public | Public recognitions |
| `certificate` | `list` | Public | Certificates and categories |
| `writing` | `list` | Public | Published writings with valid cover images |
| `settings` | public settings query | Public | Copy, SEO, visibility, ticker settings |
| `assistant` | `chat` | Public | Ask Xervis portfolio questions |
| `contact` | public submission | Public | Validated visitor contact form |
| `analytics` | `track` | Public | Records one throttled visit event with server-observed IP, country, path, referrer, and user-agent metadata |

Protected namespaces are `admin`, `profileAdmin`, `projectAdmin`, `experienceAdmin`, `skillAdmin`, `awardAdmin`, `certificateAdmin`, `writingAdmin`, `settingsAdmin`, `contactAdmin`, `uploadAdmin`, and `analyticsAdmin`. They provide authenticated CRUD, reorder, sync, upload, message, settings, and analytics operations.

`analyticsAdmin.summary` accepts `{ days }` from `1` through `365` and returns total visits, distinct IPs, suspicious-event counts, top countries, top paths, per-IP counts, and daily activity. The admin overview provides Today, 7 days, 30 days, 3 months, 6 months, and 1 year filters. Country detection uses trusted proxy country headers when available and falls back to `ZZ` (unknown). Raw IP visibility is restricted to authenticated administrators and events older than 365 days are deleted when the report query runs.

## Database and CMS

Major PostgreSQL tables are `profiles`, `projects`, `experiences`, `skills`, `awards`, `certificates`, `writings`, `contact_messages`, `site_settings`, `uploads`, `visit_events`, `users`, `admin_sessions`, `admin_credentials`, `admin_login_attempts`, and `admin_password_resets`. Ordering uses explicit `orderIndex` fields.

Log in at `/admin/login`, choose a content tab, edit, and save. Use reorder controls rather than IDs. Profile media is CMS-driven and feeds About, favicon-related metadata, and Open Graph/Twitter preview metadata. Project forms support live/video links, screenshots, and case studies. Medium synchronization normalizes the feed URL, deduplicates records, enriches images where possible, and leaves new records unpublished until approved.

The public writing section renders featured articles first. Each Read More click reveals **six additional articles**, resets when a category changes, and stops when that category is exhausted.

## Security and privacy

Admin mutations use same-origin protection, role checks, input validation, and expiring HttpOnly session cookies. Stored session tokens are digested. Never commit `.env`, credentials, raw session tokens, private uploads, or provider keys. Raw IP data is operationally sensitive and must only be displayed to authenticated administrators; do not export it to public responses, logs, or client analytics. Production PostgreSQL must use the Supabase TLS connection string; certificate verification must not be disabled in production.

Visitor analytics records at most one normal visit per browser session, while the server uses the observed IP for short-lived throttling and stores the IP with each recorded event for the bounded 365-day reporting window. The table also stores country, path, referrer host, user-agent, suspicious-event flag, and timestamp. The suspicious flag is a burst-traffic signal for investigation, not proof of a DDoS attack or a verified unique human visitor. Add a visible privacy notice describing purpose, fields, retention, administrator access, and deletion policy before public launch.

## Deployment on Render

Render should build with `pnpm install --frozen-lockfile && pnpm run build` and start with `pnpm run start`. Configure `DATABASE_URL` and all required auth, storage, and AI variables in Render. Apply the PostgreSQL schema before the first analytics request. The analytics boot guard is additive and idempotent, but migration `0005_raw_ip_analytics.sql` should still be applied through the normal migration workflow. Add `nazmussakib.tech` as a Render custom domain and configure the provider CNAME exactly as Render instructs. Confirm HTTPS `200` on both the Render hostname and custom domain after deployment.

## Adding a feature

Update `db/schema.ts`, generate/apply a PostgreSQL migration, add procedures under `api/routers/`, register them in `api/router.ts`, connect the UI through the typed tRPC client, and update this README. Include loading, empty, error, authorization, keyboard, reduced-motion, and mobile states.

Before pushing:

```bash
pnpm run check
pnpm run build
pnpm run test
git diff --check
```

## Links and attribution

- [Portfolio](https://nazmussakib.tech)
- [GitHub](https://github.com/Nazmussakib247)
- [LinkedIn](https://www.linkedin.com/)

This is a personal professional portfolio for Nazmus Sakib. All rights reserved by Nazmus Sakib. Retain attribution and do not reuse private content, credentials, personal contact data, or uploaded media.
