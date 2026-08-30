# Golden Rule Air Conditioning & Heating — Website + Operations Platform

A complete rebuild of [goldenrulecomfort.com](https://goldenrulecomfort.com) as a modern HVAC
platform: cinematic public website (Next.js 16 + React Three Fiber + GSAP-style motion) plus a
full operations control center — CRM, lead pipeline, service-request wizard, appointments,
review management, missed-call text-back, AI assistant, analytics, reports, and CMS.

All business facts, service copy, articles, testimonials, and imagery come from the real site
(scraped into `../scraped-site/`, seeded via `prisma/seed-data/`). Nothing is fabricated.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Three.js / React Three Fiber** — hero scene, interactive HVAC explorer, airflow visualization
- **Framer Motion** — motion system (reveals, transitions, micro-interactions; honors reduced motion)
- **Prisma + SQLite** — zero-config local database (swap `DATABASE_URL` + provider for Postgres)
- **Recharts + custom SVG graphs** — admin analytics & pipeline funnel
- **Anthropic Claude** (optional) — "Golden Rule Comfort Assistant" chatbot + business insights;
  falls back to built-in guided answers when no API key is configured
- **jose + bcryptjs** — cookie-session admin auth with role-based access

## Quick start

```bash
npm install
npx prisma db push          # create SQLite schema (prisma/dev.db)
npx tsx prisma/seed.ts      # seed real content + demo CRM data
npm run dev                 # http://localhost:3000
```

**Admin panel:** http://localhost:3000/admin
Login: `admin@goldenrule.local` / `GoldenRule2026!` (change via `SEED_ADMIN_PASSWORD` in `.env`
before seeding, and change it in production).

Demo CRM records are labeled `isDemo: true` and never mix with real submissions. To wipe demo
data: delete rows where `isDemo = 1`, or delete `prisma/dev.db` and re-run push+seed.

## Environment

Copy `.env.example` → `.env`. Everything optional degrades gracefully:

| Variable | Purpose | Without it |
|---|---|---|
| `DATABASE_URL` | Prisma database | required (SQLite path is fine) |
| `AUTH_SECRET` | signs admin session JWTs | dev fallback secret (set in prod!) |
| `AI_API_KEY` | Claude for chatbot + insights | rule-based assistant, deterministic insights |
| `SMS_API_KEY` | real SMS provider | messages mocked + logged to DB |
| `EMAIL_API_KEY` / `MAPS_API_KEY` / `ANALYTICS_ID` / `REVIEW_API_KEY` | integrations | features stay in mock/keyless mode |

## Architecture

```
src/app/(public)/…        public site (home, services, areas, news, wizard, …)
src/app/admin/login       admin sign-in
src/app/admin/(dashboard) control center (auth-gated server layout)
src/app/api/…             REST API (public intake + admin, role-gated)
src/lib/…                 db, auth, leads, validation, analytics, site facts
src/components/…          ui kit, motion kit, three scenes, home sections, admin
prisma/                   schema, seed, seed-data (real content JSON)
public/images/            190 images reused from the original site
public/brand/             logo + favicons
```

### Key API routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/service-requests` | POST | public | wizard submission → customer + lead + notification |
| `/api/estimate`, `/api/contact`, `/api/careers` | POST | public | intake forms → leads/submissions |
| `/api/chat`, `/api/chat/lead` | POST | public | AI assistant + chat lead capture |
| `/api/uploads` | POST | public | wizard photo/video upload (validated) |
| `/api/missed-calls` | POST | webhook (`x-webhook-secret` if `MISSED_CALL_WEBHOOK_SECRET` set) | missed-call → lead + auto text-back |
| `/api/analytics/track` | POST | public | first-party events (page_view, phone_click, …) |
| `/api/auth/login,logout,me` | POST/GET | – | admin session |
| `/api/leads`, `/api/leads/[id]`, `…/messages`, `…/estimates` | GET/POST/PATCH | session | CRM |
| `/api/appointments`, `/api/appointments/[id]` | GET/POST/PATCH | session | scheduling |
| `/api/admin/*` (analytics, reports, insights, reviews, missed-calls, articles, services, users, settings, search, notifications, audit, …) | varies | session + role | control center |

### Roles

`SUPER_ADMIN`, `ADMIN` (settings/users), `MANAGER`, `DISPATCHER`, `TECHNICIAN`,
`MARKETING`, `CONTENT_EDITOR` (content). Every mutation is written to the audit log.

## Production

1. Set a strong `AUTH_SECRET`, a real `SEED_ADMIN_PASSWORD`, and `NEXT_PUBLIC_SITE_URL`.
2. For Postgres: change `provider = "postgresql"` in `prisma/schema.prisma`, set `DATABASE_URL`,
   run `npx prisma db push && npx tsx prisma/seed.ts`.
3. `npm run build && npm start` (or deploy to any Node host; Vercel needs a hosted DB).
4. Point your SMS provider's missed-call webhook at `POST /api/missed-calls` with the shared secret.
5. SEO is built in: per-page metadata, JSON-LD (HVACBusiness, Service, Article, FAQPage,
   BreadcrumbList), `sitemap.xml`, `robots.txt`.

## Testing checklist

- `npm run build` — type-checks and builds every route
- Public: home 3D hero (+ reduced-motion fallback), nav mega-menus, wizard end-to-end
  (creates lead → appears in `/admin/leads`), chat assistant, phone links, mobile CTA bar
- Admin: login, kanban drag between statuses, lead detail tabs, calendar month/week/day,
  review request flow (lead → COMPLETED → Request Review), settings save, CSV export,
  audit log entries, dark/light toggle, Cmd/Ctrl+K palette
- `npx prisma studio` to inspect data directly
