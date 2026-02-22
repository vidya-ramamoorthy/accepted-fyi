# accepted.fyi

> "Levels.fyi for college admissions" — a crowdsourced, verified platform where students share admissions outcomes so others can make data-driven college decisions.

## Project Decisions

### Name: accepted.fyi
- Domain-hack style inspired by levels.fyi
- Clear, memorable, describes exactly what the platform is

### Tech Stack

| Layer | Technology | Cost (Free Tier) |
|-------|-----------|-----------------|
| Framework | Next.js 16 (App Router, TypeScript) | $0 (open source) |
| Hosting | Vercel Hobby tier | $0/month |
| Database | Supabase Postgres | $0/month (500 MB storage) |
| Auth | Supabase Auth (Google + Apple sign-in) | $0/month (50,000 MAUs free) |
| File Storage | Supabase Storage | $0/month (1 GB free) |
| ORM | Drizzle ORM | $0 (open source) |
| Cache / Rate Limiting | Upstash Redis | $0/month (10K commands/day free) |
| Styling | Tailwind CSS + shadcn/ui | $0 (open source) |
| Testing | Vitest (unit) + Playwright (e2e) | $0 (open source) |
| AI Verification | Claude API or GPT-4 Vision | Pay-per-use (pennies per doc) |
| Domain | .fyi domain | ~$15-20/year |

### Cost Projections by User Count

| Users | Vercel | Supabase | Upstash Redis | AI Verification | **Total/month** |
|-------|--------|----------|---------------|-----------------|-----------------|
| 0 - 1,000 | $0 (Hobby) | $0 (Free) | $0 (Free) | $0 | **~$1.50** |
| 1,000 - 5,000 | $20 (Pro) | $0 (Free) | $0 (Free) | ~$5 | **~$27** |
| 5,000 - 10,000 | $20 (Pro) | $25 (Pro) | $0-3 | ~$10 | **~$58** |
| 10,000 - 25,000 | $20 (Pro) | $25 + usage | $10 (Pro) | ~$25 | **~$82** |
| 25,000 - 50,000 | $20 (Pro) | $50 | $10 | ~$40 | **~$122** |
| 50,000 - 100,000 | $20 (Pro) | $75 | $10 | ~$50 | **~$157** |

### Free Tier Thresholds (When You Must Upgrade)
- **Supabase Auth:** 50,000 MAUs → need Pro ($25/mo)
- **Supabase DB:** 500 MB storage → need Pro ($25/mo)
- **Vercel:** 100 GB bandwidth/mo → need Pro ($20/mo)
- **Upstash Redis:** 10K commands/day → need Pro ($10/mo)

### Annual / One-Time Costs
- Apple Developer Account: **$99/year** (required for Apple Sign-In)
- Domain (accepted.fyi): **~$15-20/year**
- Total year 1 fixed costs: **~$115-120**

## Architecture Decisions

### Authentication
- Supabase Auth handles Google + Apple OAuth
- Chosen over Clerk (expensive at scale: $0.02/MAU after 10K) and Auth.js (more setup work)
- Supabase Auth gives 50,000 MAUs free vs Clerk's 10,000

### Database Schema (Relational — Postgres)
- Users, Schools, Admissions Submissions, Verification Records, Flags
- Row Level Security (RLS) at the DB level: users can only edit their own submissions
- Unique constraint: `(user_id, school_id, admission_cycle)` — one submission per school

### Verification Strategy (3-Tier Trust System)
1. **Bronze (Unverified):** Self-reported data, shown with caveat label
2. **Silver (.edu Verified):** User verifies .edu email from claimed school
3. **Gold (Document Verified):** Admission letter upload reviewed by AI (Claude/GPT-4 Vision)
- Privacy: Never store full documents. Extract structured data, then delete.

### Anti-Gaming Measures
- Rate limiting: 5 submissions/hour (IP), 25 schools/user/cycle (account)
- Community flagging: 3-5 flags auto-hides for review
- Anomaly detection: statistical outliers flagged automatically
- Delayed visibility: 24-48h hold before public aggregation
- "Post to view" gate: must submit own data to see others
- Disposable email blocking

### Data Gating Model
- Users must submit their own admissions data before viewing others' results
- This is the core viral mechanic and data quality driver

## Monetization Roadmap (Future)
1. **Phase 1:** Free — build the data moat
2. **Phase 2:** Freemium ($9.99/mo or $59.99/yr) — advanced filters, individual profiles
3. **Phase 3:** Admissions consulting marketplace (Levels.fyi model)
4. **Phase 4:** B2B to schools/counselors ($30-100K/year per district)
5. **Phase 5:** Lead gen for test prep companies (Princeton Review, Kaplan, Khan Academy)

## Growth Strategy
- Guerrilla seed in College Confidential, Discord servers, admissions TikTok
- Target March-April Regular Decision wave for data collection
- Programmatic SEO: auto-generate pages for "MIT acceptance rate for 1500 SAT" etc.
- "Decision Day" shareable cards for social media virality
- School-level leaderboards

## YC Timeline
- **Target:** YC Fall 2026 batch (application deadline ~Aug/Sep 2026)
- **Milestones needed:** 5,000+ outcomes, 10,000+ users, 20%+ MoM growth
- **Positioning:** Data network effect business (like levels.fyi), NOT "another college tool"

## Competitive Landscape
- No existing platform combines: crowdsourced individual outcomes + structured DB + holistic profiles + free access + cross-school aggregation + verification
- Closest competitors: CollegeData (legacy, poor UX), AdmitSee (paywalled, essay-focused), Naviance (locked to single schools)
- Gap confirmed: zero startups found building "levels.fyi for admissions"

## Inspiration
- **Levels.fyi:** Google Forms/Sheets for 2 years, guerrilla seeded on Blind, 2.5M MAU
- **Blind:** Korean BBQ parties for first 100 users, Uber scandal tripled growth, 3.2M users

## Feature Roadmap

### Phase 0: Data Foundation (Pre-Launch)

#### Public Data Seeding Pipeline
- **College Scorecard API integration**: Ingest institutional-level stats (acceptance rates, SAT/ACT ranges, enrollment demographics, graduation rates) for all US schools. Free government API.
- **IPEDS data import**: Bulk import admissions/enrollment/financial aid data. Every school receiving federal aid reports here.
- **Common Data Set (CDS) parsing**: Annual per-school reports with detailed admissions breakdowns. Parse PDFs with AI.
- **Reddit r/ApplyingToCollege scraping**: Parse decision megathreads with Claude to extract structured individual outcomes (GPA, SAT, decision, school). Label as `source: "reddit"`, `verification_tier: "public_scraped"`.
- **College Confidential parsing**: Same approach for CC results threads. Decades of historical data available.
- **School class profile ingestion**: Scrape "Class of 20XX" profile pages from school admissions sites for aggregate demographics and score ranges.
- All seeded data clearly labeled with source provenance — never mixed with verified user submissions without disclosure.

#### Data Schema Additions for Seeded Data
- `data_source` field on submissions: `"user"` | `"reddit"` | `"college_confidential"` | `"public_scraped"`
- `institutional_stats` table: acceptance_rate, sat_25th, sat_75th, act_25th, act_75th, enrollment, yield_rate, class_size — sourced from College Scorecard/IPEDS/CDS
- `decision_timeline` table: school_id, cycle, round, release_date — track when schools release decisions

### Phase 1: Verification & PII Safety

#### Document Verification (Gold Tier)
- Client-side redaction tool: before uploading admission letter screenshot, users can black out name, address, student ID with a drawing tool
- Server-side AI extraction: Claude Vision processes image in memory, extracts ONLY: school name, decision, cycle year
- **Immediate deletion**: image never written to database or storage. Processed in serverless function, result returned, image discarded
- Stored result: `{ verified: true, verifiedAt: timestamp, method: "document" }` — no image reference, no OCR text dump
- Fallback: if AI extraction fails, flag for manual review (admin only, image auto-deletes after 24h)

### Phase 2: Tiered Access Model

#### User Types & Access Levels
| User Type | Sees | Must Do |
|-----------|------|---------|
| **Anonymous visitor** | Landing page, school list, aggregate stats (acceptance rate, avg GPA/SAT), official institutional data | Nothing — SEO funnel |
| **Signed-in, no submission** | Above + chances calculator + school detail pages with official data | Create account (Google OAuth) |
| **Signed-in, 1+ submission** | Above + individual crowdsourced submission profiles | Submit at least one result |

#### Underclassman Path (Freshmen/Sophomores)
- Sign up and build a "My Profile" with current stats: GPA, planned courses, target school wishlist
- Get access to chances calculator + aggregate data as value exchange for account creation
- Individual crowdsourced profiles gated until they contribute admission results (senior year)
- Optional: contribute non-admission data ("sophomore at X HS, taking Y APs") to stay engaged and build high school profile dataset

### Phase 3: Viral & Engagement Features

#### Shareable Decision Cards
- Beautiful, branded image card generated per submission: school logo, decision badge, anonymized stats
- Optimized for Instagram Stories, TikTok, Twitter/X
- Includes accepted.fyi watermark — free marketing with every share
- One-tap share from dashboard after submitting

#### Chances Calculator
- `/chances` page: input GPA, SAT/ACT, AP/IB count, state, intended major
- Compare against historical crowdsourced + institutional data
- Output: schools categorized as Reach / Match / Safety with confidence scores
- Show "X out of Y students with similar stats were accepted" per school
- Available to all signed-in users (no submission required) — this is the hook for underclassmen

### Phase 4: One-Stop Shop — Institutional + Crowdsourced Data

#### School Detail Pages (Dual Data View)
- **Official data section**: acceptance rate, SAT/ACT ranges, class size, yield rate — from College Scorecard/IPEDS
- **Community data section**: crowdsourced acceptance rate, avg GPA/SAT from user submissions
- Side-by-side comparison: "Official acceptance rate: 3.2% | Community-reported: 12% (47 submissions)"
- **Decision timeline**: when this school releases EA/ED/RD decisions, based on historical data
- **Class profile**: demographics, geographic distribution, popular majors — from official sources
- This combination doesn't exist anywhere else — that's the moat

#### Real-Time Decision Tracking
- Track decision release dates per school per cycle
- Push notifications: "MIT Early Action decisions are out — submit your result!"
- Seasonal dashboards: "Decision Season 2026-2027" landing page during March-April RD wave

### UX Principles: Value Without Clutter

#### Contextual Value Messaging
- **Landing page**: ONE clear value prop + 3-step how-it-works + sample cards. No feature walls.
- **School detail pages**: let the data speak. "47 submissions | 12% accept rate | Avg GPA 3.89" > any marketing copy.
- **Empty states / gates**: show the value pitch at the exact moment a user hits a paywall/gate ("Sign in to see 47 individual profiles for Stanford")
- **Tooltips, not paragraphs**: verification tier, data source, stat methodology — hover/tap to learn, don't explain inline
- **Progressive disclosure**: homepage shows 4 blurred sample cards with "Sign in to see real data." Curiosity > explanation.
- **Onboarding flow**: 2-screen post-signup: "Here's what you'll get" → "Submit your first result" (or "Build your profile" for underclassmen)
- **No feature dumping**: each page has ONE primary action. Dashboard = submit. Schools = browse. Detail = explore data.

## Development Guidelines
- Follow TDD (test-driven design) per root CLAUDE.md
- Use descriptive variable names
- Follow proper system architecture principles
- Prefer Drizzle ORM for type-safe database queries
- Use Server Components by default, Client Components only when needed
- Implement proper error boundaries and loading states

## Cost Optimization Rules (DO NOT REGRESS)

These rules exist to keep infrastructure costs low. Violating them can 10x hosting bills. See `docs/decisions/002-cost-analysis-by-user-tier.md` and `docs/decisions/003-cost-reduction-plan.md` for full context.

### Caching Rules
- **NEVER add `export const dynamic = "force-dynamic"` to public pages.** The only page allowed to use `force-dynamic` is the auth-gated dashboard layout (`(dashboard)/layout.tsx`). Every public page must use ISR (`export const revalidate = N`) or be fully static.
- **All new public DB read queries MUST be wrapped with `unstable_cache()`.** Include a descriptive cache key and a `tags` array for targeted revalidation. See `src/lib/db/queries/schools.ts` for examples.
- **When adding a new page that reads from the DB**, always add `export const revalidate = <seconds>`. Use 3600 (1h) for institutional/school data, 1800 (30min) for crowdsourced submission data, 300 (5min) for frequently-changing list views.
- **When creating a POST/mutation endpoint that changes data**, call `revalidateTag()` for the affected cache tags so stale data is purged. See `src/app/api/submissions/route.ts` for the pattern.

### API Route Rules
- **All public GET API routes must include `Cache-Control` headers.** Use `s-maxage` for CDN caching. See existing routes for patterns:
  - Public data: `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`
  - Autocomplete: `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`
  - Auth-gated reads: `Cache-Control: private, s-maxage=60`

### Database Rules
- **Never load unbounded result sets.** All list queries must use `LIMIT`/`OFFSET` pagination. Default page size: 20-30, max: 100.
- **Never `SELECT *` from tables.** Always select only the columns needed. Use `SCHOOL_CARD_SELECT` pattern for card views vs full detail.
- **Aggregate stats must be computed in SQL**, not by fetching all rows and computing in JS. See `getSubmissionStatsForSchool()` for the pattern.
- **Connection pool limits must stay conservative.** Build: `max: 2`, runtime: `max: 10`. Do not increase without verifying Supabase connection limits.

### Build Rules
- **Build workers are capped at 4 CPUs** in `next.config.ts` to prevent DB connection exhaustion. Do not remove or increase `experimental.cpus` without verifying DB capacity.

### Before Merging Checklist
When reviewing PRs that touch pages or DB queries, verify:
1. No new `force-dynamic` on public pages
2. New DB queries are wrapped with `unstable_cache()`
3. New pages have `export const revalidate`
4. Mutations call `revalidateTag()` for affected caches
5. API GET routes include `Cache-Control` headers
6. List queries are paginated with `LIMIT`/`OFFSET`
