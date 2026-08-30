# Golden Rule build conventions (for all agents)

You are building part of a Next.js 16 (App Router, `src/` dir, TypeScript, Tailwind v4) site for
Golden Rule Air Conditioning & Heating. Other agents build other parts in parallel.
**Write ONLY the files assigned to you. Never edit shared files owned by others. Do NOT run
npm install / npm run build / prisma commands — the orchestrator does that.**

## Hard content rules
- Business facts come ONLY from `src/lib/site.ts` (COMPANY, SOCIALS, CERTIFICATIONS, BRANDS,
  GUARANTEES, VIDEOS, SERVICE_CITIES, DIVISIONS, SERVICE_TYPES, SITE_URL). Import, never re-type.
- NEVER invent business claims, stats, prices, warranties, review counts, response times, or
  certifications. No "5,000+ happy customers", no "average 4.9 stars", no "same-day service".
- Verified facts you may state: founded 2007; Houston HQ (9306 Thomasville Dr, 77064); phone
  281-500-7874 / 281-500-RUSH; license TACLA27294C; serves Houston, Cypress, Spring, Tomball,
  Katy, Sugar Land; certifications NATE/BBB/RSES/ACCA/NCI/TACCA; Wells Fargo financing;
  GoldStandard™ maintenance; DARE™ installation; GoldCertified™ systems; 5 Gold Plated Guarantees;
  brands per BRANDS; Matthew 7:12 guiding principle; emergency service available.
- Business hours and a public email are NOT published — never invent them. Contact = phone + forms.

## Tech conventions
- Next 16: `params`/`searchParams` in pages are **Promises** — `const { slug } = await params`.
- DB: Prisma client via `import { db } from "@/lib/db"`. Schema: `prisma/schema.prisma`
  (Lead, Customer, LeadActivity, ServiceRequest, Appointment, Estimate, Review, ReviewRequest,
  MissedCall, Message, ChatSession/ChatMessage, Article, Service, ServiceArea, CareerApplication,
  ContactSubmission, Notification, AnalyticsEvent, Setting, AuditLog, User). SQLite — no enums,
  use the string unions documented in schema comments; no `mode: "insensitive"` in queries.
- Auth (admin only): `import { getSession, requireSession, ADMIN_ROLES, CONTENT_ROLES, audit } from "@/lib/auth"`.
  API routes: `const user = await requireSession()` (throws a 401/403 Response — wrap in try/catch
  and `if (e instanceof Response) return e`).
- Leads: ALWAYS create via `createLead()` from `@/lib/leads` (also writes activity + notification).
  Other helpers there: `getSetting`, `setSetting`, `sendSms` (mock adapter).
- Validation: zod schemas in `src/lib/validation.ts` — extend there if needed (it's shared; only
  Agent C may edit it). All public forms include a `website` honeypot field (must be empty).
- Client analytics: `import { track, getUtmParams } from "@/lib/analytics-client"` — call
  `track("form_start")` on first interaction, `track("form_complete")` on success; spread
  `...getUtmParams()` into lead-creating POST bodies.
- Utilities: `cn`, `formatDate`, `formatDateTime`, `timeAgo`, `initials`, `readTimeMinutes`
  from `@/lib/utils`.

## Design system (Tailwind v4 tokens in globals.css)
- Colors: `gold` #FCCD35, `gold-deep`, `gold-soft`, `ink` (near-black), `night` (dark section bg),
  `night-soft`, `night-line`, `paper` (warm light bg), `line` (hairline), `body`, `muted`,
  `danger`, `success`. Shadows: `shadow-lift`, `shadow-gold`.
- Helper classes: `.container-site` (page container), `.display` (Space Grotesk heading),
  `.eyebrow` (small caps label), `.prose-site` (CMS/article body).
- Fonts auto-applied; headings use `font-display` / `.display`.
- UI kit (import, don't re-create): `Button`, `ButtonLink` (variants gold/dark/outline/
  outline-light/ghost/danger; sizes sm/md/lg) from `@/components/ui/Button`; `Input`, `Textarea`,
  `Select`, `Label`, `FieldError` from `@/components/ui/Field`; `Card`, `Badge` (tones) from
  `@/components/ui/Card`; `Dialog` from `@/components/ui/Dialog`; `Tabs` from `@/components/ui/Tabs`.
- Motion kit: `Reveal`, `StaggerGroup`, `StaggerItem` from `@/components/motion/Reveal`;
  `Counter`; `MagneticButton`; `Parallax`. Respect `useReducedMotion` for any custom animation.
  Subtle motion only; transitions ≤ 600ms.
- Existing layout: public pages render inside `(public)/layout.tsx` (Header/Footer/MobileCTABar/
  ChatWidget already wired). Header is fixed 72px — dark-hero pages need top padding or a
  full-bleed hero; light pages start with `pt-[72px]` equivalent spacing (e.g. a `PageHero`).
- Page pattern for standard pages: light hero band (paper bg) with eyebrow + display title +
  intro, then content sections alternating white/paper, ending before the shared footer CTA band
  (the Footer already has a "Need HVAC service?" CTA — don't duplicate it right above).
- Phone links: use `PhoneLink` from `@/components/layout/PhoneLink` (tracks phone_click).
- Images: use files under `/public/images/` (190 real site images — see prisma/seed-data/*.json
  hero fields) via `next/image`. Never hotlink external images.

## SEO
- Every page exports `metadata` (title ≤ 60 chars, description ≤ 160) and
  `alternates: { canonical: "/path" }`. Dynamic pages: `generateMetadata` + `generateStaticParams`
  where data is seeded. JSON-LD via inline `<script type="application/ld+json">` where assigned.

## Data states
Every list/detail view handles loading (server components: none needed), empty ("no X yet" with
a helpful CTA), and error states. Client fetches show loading + error UI. No blank screens.
