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
| Auth | Supabase Auth (Google sign-in) | $0/month (50,000 MAUs free) |
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
- Domain (accepted.fyi): **~$15-20/year**
- Total year 1 fixed costs: **~$15-20**

## Architecture Decisions

### Authentication
- Supabase Auth handles Google OAuth
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

## Parent Audience Strategy

### Why Parents Matter
- Parents are the primary decision-influencer in college admissions, especially for:
  - **First-gen families** with zero context on admissions competitiveness
  - **Immigrant parents** unfamiliar with the US admissions system
  - **Parents of freshmen/sophomores** planning years ahead
- Parents are the ones searching "what SAT score do you need for MIT" at 11pm — aligns perfectly with programmatic SEO strategy
- Higher willingness to pay for premium features (Phase 2 monetization) compared to students

### Parent-Specific Value Props
- **Chances Calculator**: "Will my kid get in?" — the #1 parent anxiety, and our hook
- **Institutional data pages**: acceptance rates, SAT/ACT ranges, class profiles — parents consume this data voraciously
- **Community-reported outcomes**: "Students like my child who applied to Stanford" — the data parents can't find anywhere else
- **Decision timelines**: when schools release EA/ED/RD decisions — parents track this obsessively

### Channel Strategy for Parents

| Channel | Tactic | Priority |
|---------|--------|----------|
| **Facebook Groups** | Join and contribute to groups like "College Admissions & Financial Aid" (100K+ members), "Paying for College 101", school-specific parent groups ("Parents of Stanford Applicants 2027"), regional groups ("Bay Area College Prep Parents"). Answer questions with data, soft-promote the tool. | High |
| **LinkedIn** | "Building in public" posts — share milestones, admissions data insights, founder story ("I'm building the Levels.fyi for college admissions"). Reaches parents in professional network, YC scouts, potential advisors/investors, college counselors. | High |
| **Reddit** | r/ApplyingToCollege has active parent posters. r/Parenting occasionally has college threads. Same guerrilla approach as student channels. | Medium |
| **Parent-focused SEO** | Target long-tail queries parents search: "average GPA for UCLA admission", "is 1400 SAT good enough for Ivy League", "college acceptance rate calculator". These have high intent and low competition. | High |

### LinkedIn — Build in Public, NOT Stealth Mode
- **No stealth mode.** The moat is the data network effect, not proprietary tech. Stealth delays network growth.
- Levels.fyi was never in stealth — they started with a public Google Sheet
- LinkedIn is ideal for the founder narrative and reaching parents, advisors, YC alumni
- **What to share**: milestones, data insights, admissions trends, product updates
- **What to keep quiet**: specific growth metrics (exact user counts) until they're impressive enough for YC

### Parent UX Considerations
- Parents and students may share the same account or browse together — keep UI approachable for non-Gen-Z users
- Consider a "Parent Guide" landing page explaining what the platform is and how their child can use it
- Email digest option: weekly summary of new data for schools on their child's wishlist (engagement + retention)
- Parent-friendly language in tooltips and explainers — avoid admissions jargon without context

## Content Strategy & Sample Posts

### Channel Overview

| Channel | Audience | Content Type | Timing |
|---------|----------|-------------|--------|
| TikTok / Instagram Reels | Students (Gen Z) | Short-form video: teasers, data insights, decision card reveals | Teaser: pre-launch. Full push: March RD wave |
| Reddit (r/ApplyingToCollege) | Students + parents | Text posts, megathread comments, "chance me" replies | During decision releases, ongoing |
| Facebook Groups | Parents (35-55) | Helpful text posts in admissions parent groups | Ongoing, peak March-April |
| LinkedIn | Founders, parents, advisors, YC scouts | "Building in public" posts — milestones, data insights | Start immediately, no live product required |
| Discord | Students | Server intros, bot integration (future) | After launch |

### Content Cadence
- **LinkedIn**: 1-2x/week (building in public narrative)
- **TikTok/Reels**: 3-5x/week during March decision wave, 1x/week otherwise
- **Reddit**: Opportunistic — post during decision megathreads, reply to "chance me" posts
- **Facebook**: 1x/week in 3-5 active parent groups, respond to questions with data

### Pre-Launch vs Post-Launch Content
- **Pre-launch (NOW through mid-March)**: Teasers (no link), LinkedIn origin story, soft-launch in 1-2 Discord servers for beta feedback
- **Launch (mid-March, aligned with RD releases)**: Full push across all channels with live link, shareable decision cards, data insight videos
- **Post-launch (April+)**: Recurring data insight series, user testimonial reposts, school-specific content

## Launch Logistics Checklist

### Blocks Launch (Must Complete Before Public Reveal)
1. **Deploy to Vercel** — point accepted.fyi domain to Vercel hosting
2. **Seed institutional data** — run College Scorecard API ingestion so school pages have real stats (acceptance rates, SAT/ACT ranges, enrollment)
3. **Build shareable decision cards** — branded image cards with school logo, decision badge, anonymized stats. Non-negotiable for TikTok/Instagram virality
4. **End-to-end testing** — recruit 5-10 friends to test the full flow: sign up → submit → browse → chances calculator
5. **Seed 50-100 crowdsourced submissions** — either from beta testers or parsed Reddit data, so browse/chances pages aren't empty

### Should Complete Before Launch
6. **Reddit data ingestion pipeline** — parse r/ApplyingToCollege decision megathreads to seed crowdsourced data at scale
7. **Open Graph / social meta tags** — ensure shared links show a compelling preview card on all platforms
8. **Mobile responsiveness audit** — students will access primarily from phones via TikTok/Instagram links

### Can Launch Without (Build After)
10. .edu email verification (Silver tier)
11. Email notification system / weekly digests
12. Document verification (Gold tier — paused until 5,000 users)
13. Data ingestion from College Confidential, Common Data Set PDFs

### Target Launch Window
- **Ideal: March 15-20, 2026** — Regular Decision releases begin (Ivy Day typically late March)
- **Why**: Peak admissions anxiety, students actively posting decisions, parents refreshing portals
- **Risk of launching before ready**: empty data = low trust = users don't come back. Better to launch 1 week late with seeded data than 1 week early with empty pages.

## TikTok Strategy

### Do NOT Reveal Yet (Feb 22)
- Product is not deployed to a live URL
- Shareable decision cards (the viral mechanic) are not built
- No real crowdsourced data to show — empty browse pages kill credibility
- Launching a reveal video with no working link wastes the initial attention spike

### Pre-Launch Teaser Phase (Feb 22 - March 10)
- Film teaser content NOW but don't post the link
- Build anticipation: "something is coming for decision season"
- Show the problem (College Confidential chaos, useless chance-me threads) without revealing the solution yet
- Use trending audio and admissions anxiety content to build following first

### Launch Phase (March 15-20)
- Reveal video with live link, shareable cards, real data
- Post daily during decision wave (March 15 - April 1)
- Engage with every comment, duet decision reaction videos
- Cross-post decision cards from users who share on their stories

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
- **Reddit r/collegeresults ingestion** (DONE): See "Reddit Data Pipeline" section below.
- **College Confidential parsing**: Same approach for CC results threads. Decades of historical data available.
- **School class profile ingestion**: Scrape "Class of 20XX" profile pages from school admissions sites for aggregate demographics and score ranges.
- All seeded data clearly labeled with source provenance — never mixed with verified user submissions without disclosure.

##### Reddit Data Pipeline (Implemented)

**Source:** r/collegeresults — a 67K-subscriber subreddit where students post structured admissions results using a standardized template with Demographics, Academics, Standardized Testing, Extracurriculars, and Decisions sections.

**Data access:** [Arctic Shift](https://arctic-shift.photon-reddit.com) — a free, public Reddit archive that provides full historical access to Reddit data. Arctic Shift uses Pushshift archives for pre-April 2023 data and collects directly from the official Reddit API for newer posts. Posts are archived within seconds of creation. This bypasses Reddit's public API limit of ~1,000 posts per listing endpoint.

**Pipeline:** `scripts/ingest-reddit.ts`
- Fetches all ~14,000 posts from r/collegeresults via Arctic Shift's `/api/posts/search` endpoint
- Parses the standardized template (bold `**Decisions**`, italic `*Acceptances:*`, spoiler tags `>!Accepted!<`, hash headers `# Results`)
- Extracts per-school decisions with GPA, SAT/ACT, application round, demographics
- Matches school names to our `schools` table using exact match, case-insensitive partial match, and a 200+ entry abbreviation map (MIT, UPenn, etc.)
- Deduplicates via partial unique index on `(source_post_id, school_id) WHERE user_id IS NULL`
- All records stored with `data_source: "reddit"`, `verification_tier: "bronze"`, `user_id: NULL`
- CHECK constraint ensures `user_id` is required for `data_source = 'user'` but allowed null for scraped sources

**Results (as of Feb 2026):**
- 13,977 posts fetched (2018–2026)
- ~660 posts parseable (many posts are discussion/meta, not results)
- ~3,100+ individual admission outcomes inserted
- Covers cycles from 2019-2020 through 2025-2026
- Top schools: Stanford, UCLA, UC Berkeley, UPenn, Yale, Princeton, Harvard, Cornell, Columbia, Michigan

**Limitations:**
- Arctic Shift excludes private/quarantined subreddits (not an issue for r/collegeresults)
- Pre-2015 Pushshift data has known completeness gaps
- Parser handles the official template + common variants but does not cover all freeform formats (~5% parse rate across all posts; many posts are non-results discussion)
- Unmatched school names (~1,000 decisions skipped) from misspellings, international schools, or freeform annotations mixed into school names

#### Data Schema Additions for Seeded Data
- `data_source` field on submissions: `"user"` | `"reddit"` | `"college_confidential"` | `"public_scraped"`
- `institutional_stats` table: acceptance_rate, sat_25th, sat_75th, act_25th, act_75th, enrollment, yield_rate, class_size — sourced from College Scorecard/IPEDS/CDS
- `decision_timeline` table: school_id, cycle, round, release_date — track when schools release decisions

### Phase 1: Verification & PII Safety

#### Document Verification (Gold Tier) — PAUSED until 5,000 users
> **Status:** Paused. Will revisit when the platform reaches 5,000 registered users. The current focus is on data ingestion, engagement features (Chances Calculator), and SEO growth.

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
