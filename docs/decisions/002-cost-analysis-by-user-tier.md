# 002: Cost Analysis by User Tier

**Date:** 2026-02-22
**Status:** Active
**Context:** Detailed cost breakdown for storage, deployment, and services at 1,000 / 5,000 / 10,000 users.

---

## Assumptions

- **Storage per user:** ~5-10 KB (profile + 3-5 submissions + metadata)
- **Bandwidth per page view:** ~200-500 KB (Next.js SSR + static assets via CDN)
- **Average page views per user/month:** ~20
- **AI verification rate:** ~10% of users upload a document for Gold verification
- **AI cost per verification:** ~$0.01-0.02 (Claude Vision / GPT-4 Vision per image)
- **Redis commands per active user/day:** ~3-5 (rate-limit checks, session cache)
- **Daily active users (DAU):** ~20-30% of total registered users

---

## Monthly Cost Summary

| Service              | 1,000 Users       | 5,000 Users        | 10,000 Users       |
|----------------------|-------------------|--------------------|--------------------|
| **Vercel (Hosting)** | $0 (Hobby)        | $20 (Pro)          | $20 (Pro)          |
| **Supabase DB**      | $0 (Free)         | $0 (Free)          | $25 (Pro)          |
| **Supabase Auth**    | $0 (Free)         | $0 (Free)          | $0 (Free)          |
| **Supabase Storage** | $0 (Free)         | $0 (Free)          | $0 (Free)          |
| **Upstash Redis**    | $0 (Free)         | $0 (Free)          | $0-3               |
| **AI Verification**  | ~$1               | ~$5                | ~$10               |
| **Domain**           | ~$1.50            | ~$1.50             | ~$1.50             |
| **Total/month**      | **~$2.50**        | **~$26.50**        | **~$59.50**        |
| **Total/year**       | **~$30**          | **~$318**          | **~$714**          |

> Year 1 add ~$18 for fixed costs (domain registration $18).

---

## Detailed Breakdown

### 1. Storage (Supabase Postgres)

| Metric                   | 1,000 Users | 5,000 Users | 10,000 Users |
|--------------------------|-------------|-------------|--------------|
| User profile rows        | 1,000       | 5,000       | 10,000       |
| Submission rows (~4/user)| ~4,000      | ~20,000     | ~40,000      |
| School rows (static)     | ~5,000      | ~5,000      | ~5,000       |
| Institutional stats rows | ~5,000      | ~5,000      | ~5,000       |
| Estimated DB size        | ~15 MB      | ~60 MB      | ~120 MB      |
| Free tier limit          | 500 MB      | 500 MB      | 500 MB       |
| **Tier needed**          | Free        | Free        | Pro ($25/mo) |

**Why Pro at 10K:** While 120 MB is under the 500 MB storage cap, Supabase Free tier has a 500 MB bandwidth limit and limited connection pooling. At 10,000 users with concurrent queries, you'll hit connection limits and need Pro for pooling + 8 GB bandwidth.

### 2. Deployment & Bandwidth (Vercel)

| Metric                      | 1,000 Users | 5,000 Users | 10,000 Users |
|-----------------------------|-------------|-------------|--------------|
| Estimated page views/month  | ~20,000     | ~100,000    | ~200,000     |
| Bandwidth (avg 300 KB/view) | ~6 GB       | ~30 GB      | ~60 GB       |
| Serverless function calls   | ~10,000     | ~50,000     | ~100,000     |
| Free tier limit             | 100 GB BW   | 100 GB BW   | 100 GB BW    |
| **Tier needed**             | Hobby ($0)  | Pro ($20/mo)| Pro ($20/mo) |

**Why Pro at 5K:** While 30 GB is under the 100 GB bandwidth cap, Hobby tier limits you to 1 serverless function region and has no team features. At 5K users, you'll want Pro for faster builds, preview deployments, and better analytics. Additionally, API routes for submission/auth will approach Hobby execution limits.

### 3. Caching & Rate Limiting (Upstash Redis)

| Metric                    | 1,000 Users | 5,000 Users | 10,000 Users |
|---------------------------|-------------|-------------|--------------|
| Estimated DAU (25%)       | ~250        | ~1,250      | ~2,500       |
| Commands/day (~4/DAU)     | ~1,000      | ~5,000      | ~10,000      |
| Free tier limit           | 10K cmd/day | 10K cmd/day | 10K cmd/day  |
| **Tier needed**           | Free        | Free        | Free or Pro  |

**Why potentially Pro at 10K:** At 10K commands/day you're right at the free tier ceiling. Spike days (Decision Day traffic, viral posts) will exceed it. Upstash Pay-as-you-go starts at $0.2/100K commands, so even a small overage is cheap ($0-3/mo).

### 4. Authentication (Supabase Auth)

| Metric               | 1,000 Users | 5,000 Users | 10,000 Users |
|-----------------------|-------------|-------------|--------------|
| Monthly Active Users  | ~400        | ~2,000      | ~4,000       |
| Free tier limit       | 50,000 MAUs | 50,000 MAUs | 50,000 MAUs  |
| **Tier needed**       | Free        | Free        | Free         |

Auth stays free until 50K MAUs — not a concern until ~125K+ registered users.

### 5. AI Document Verification

| Metric                       | 1,000 Users | 5,000 Users | 10,000 Users |
|------------------------------|-------------|-------------|--------------|
| Users requesting Gold (~10%) | ~100        | ~500        | ~1,000       |
| Cost per verification        | ~$0.01      | ~$0.01      | ~$0.01       |
| **Monthly cost**             | ~$1         | ~$5         | ~$10         |

AI verification costs scale linearly. At $0.01 per document, this remains cheap even at scale. Cost only spikes if re-verification is needed (budget 1.5x for retries).

### 6. File Storage (Supabase Storage)

| Metric                | 1,000 Users | 5,000 Users | 10,000 Users |
|-----------------------|-------------|-------------|--------------|
| Stored files          | ~0          | ~0          | ~0           |
| **Cost**              | $0          | $0          | $0           |

Verification documents are processed in-memory and immediately deleted. No persistent file storage needed. Free tier's 1 GB is more than sufficient for any temporary overflow.

---

## Upgrade Triggers

| Trigger Event                           | Action Required                          | Cost Impact  |
|-----------------------------------------|------------------------------------------|-------------|
| >100 concurrent DB connections          | Upgrade Supabase to Pro                  | +$25/mo     |
| >100 GB Vercel bandwidth/month          | Upgrade Vercel to Pro (if not already)   | +$20/mo     |
| >10K Redis commands/day consistently    | Upgrade Upstash to Pay-as-you-go or Pro  | +$0-10/mo   |
| >50K monthly active users (auth)        | Upgrade Supabase Auth to Pro             | Included in Supabase Pro |
| >500 MB database storage                | Upgrade Supabase to Pro (if not already) | Included in Supabase Pro |

---

## Cost Per User

| Metric            | 1,000 Users | 5,000 Users | 10,000 Users |
|-------------------|-------------|-------------|--------------|
| Monthly total     | ~$2.50      | ~$26.50     | ~$59.50      |
| **Cost per user/month** | **$0.0025** | **$0.0053** | **$0.00595** |
| **Cost per user/year**  | **$0.03**   | **$0.064**  | **$0.071**   |

The cost per user stays under $0.01/month across all tiers — well within sustainable range for a free product building toward monetization.

---

## Key Takeaways

1. **1,000 users is essentially free** — all services stay within free tiers. Total cost is just the domain amortized monthly.
2. **5,000 users triggers the first real cost** — Vercel Pro at $20/mo is the main jump. Database and Redis remain free.
3. **10,000 users adds Supabase Pro** — the second cost step at $25/mo for connection pooling and bandwidth. Total is still under $60/mo.
4. **Storage is never the bottleneck** — structured admissions data is tiny. You won't hit 500 MB until well past 100K users.
5. **The architecture is designed to stay cheap** — no persistent file storage, minimal Redis usage, serverless compute scales to zero.

---

## When Does It Start Getting Expensive?

### Cost Curve by Scale

| Users       | Monthly Cost | Annual Cost | Pain Level         | What Changed                         |
|-------------|-------------|-------------|--------------------|-----------------------------------------|
| 0 - 1K     | ~$2.50      | ~$30        | None               | All free tiers                          |
| 1K - 5K    | ~$27        | ~$318       | Pocket change      | Vercel Pro ($20)                        |
| 5K - 10K   | ~$60        | ~$714       | Noticeable         | + Supabase Pro ($25)                    |
| 10K - 25K  | ~$82        | ~$984       | Budget line item   | + Upstash Pro ($10)                     |
| 25K - 50K  | ~$150       | ~$1,800     | Needs revenue      | + Supabase usage overages               |
| 50K - 100K | ~$250       | ~$3,000     | Needs funding/rev  | + Vercel bandwidth overages             |
| 100K+      | ~$400+      | ~$5,000+    | Must monetize      | All services at scale pricing           |

### The Three Cost Cliffs

1. **$0 to $20/mo (~3K-5K users):** Vercel Hobby limits hit. First real bill. Completely manageable out of pocket.
2. **$20 to $60/mo (~8K-10K users):** Supabase connection limits force Pro. Still cheaper than a Netflix subscription.
3. **$60 to $150+/mo (~25K-50K users):** This is the "real money" threshold. Usage-based overages start adding up. You either need revenue or funding at this point.

**Bottom line:** You can comfortably reach 25K users for under $100/mo. Costs don't become a real problem until ~50K+ users, by which point you should have either monetization or funding in place.

---

## Anonymous (View-Only) Traffic: Cost Analysis

Anonymous visitors who browse without signing in are the cheapest type of traffic — they only consume bandwidth and serverless compute. No auth calls, no DB writes, no Redis sessions, no AI verification.

### Cost Per Anonymous Page View

| Resource             | Cost Per Page View | Notes                                    |
|----------------------|-------------------|------------------------------------------|
| Vercel bandwidth     | ~$0.00004         | ~300 KB at $0.15/GB (Pro overage rate)   |
| Serverless function  | ~$0.000003        | ~50ms execution at Vercel Pro rates      |
| Supabase DB read     | ~$0.000001        | 1-2 read queries for school data         |
| CDN / static assets  | $0                | Cached at edge after first load          |
| **Total per view**   | **~$0.00005**     | ~$0.05 per 1,000 views                  |

### Anonymous Traffic Volume Scenarios

| Anonymous Visitors/mo | Page Views (3 pages avg) | Bandwidth   | Monthly Cost  |
|-----------------------|--------------------------|-------------|---------------|
| 10,000                | 30,000                   | ~9 GB       | ~$1.50        |
| 50,000                | 150,000                  | ~45 GB      | ~$7.50        |
| 100,000               | 300,000                  | ~90 GB      | ~$15          |
| 500,000               | 1,500,000                | ~450 GB     | ~$55          |
| 1,000,000             | 3,000,000                | ~900 GB     | ~$100         |

**Key insight:** You can serve 100K anonymous visitors/month for about $15. Anonymous SEO traffic is nearly free if you cache aggressively.

### What Can Be View-Only (No Sign-In Required)

Per the tiered access model in CLAUDE.md, anonymous visitors can see:

| Content                               | Auth Required? | DB Cost     | Cacheable?  |
|---------------------------------------|---------------|-------------|-------------|
| Landing page                          | No            | $0          | Fully       |
| School list / browse page             | No            | Minimal     | Fully (ISR) |
| Aggregate stats (acceptance rate, avg GPA/SAT) | No  | Minimal     | Fully (ISR) |
| Institutional data (College Scorecard/CDS)     | No  | Minimal     | Fully (ISR) |
| Programmatic SEO pages (/sat/1400-1500, /state/california) | No | Minimal | Fully (ISR) |
| Individual crowdsourced profiles      | **Yes**       | Per-query   | No          |
| Chances calculator                    | **Yes** (sign-in only) | Per-query | No     |
| Submission dashboard                  | **Yes**       | Per-query   | No          |

**~70-80% of the site surface area can be fully anonymous and view-only.** The SEO pages, school listings, and aggregate stats — which are the primary traffic drivers — require zero authentication and are the cheapest pages to serve because they can be statically generated or cached with ISR (Incremental Static Regeneration).

### How ISR Eliminates Most Anonymous Traffic Costs

With Next.js ISR, programmatic SEO pages and school detail pages are:
- Generated once at build time or on first request
- Cached at Vercel's edge CDN globally
- Revalidated every 24-72 hours (data doesn't change often)
- Served as static HTML — **no serverless function, no DB query** on subsequent visits

This means:
- The first visitor to `/colleges/sat/1400-1500` triggers one DB query and one serverless function
- The next 100,000 visitors to that page cost **only CDN bandwidth** (~$0.00004/view)
- With ~2,000+ programmatic SEO pages, the total revalidation cost is ~$0.10/day

---

## Cost Control Strategies

### 1. Technical Optimizations (Do These First — Free)

| Strategy                         | Saves On           | Impact                              |
|----------------------------------|--------------------|-------------------------------------|
| **ISR for all public pages**     | Vercel compute + DB reads | 90%+ reduction in serverless calls for anonymous traffic |
| **Edge caching headers**         | Vercel bandwidth   | CDN serves cached responses, not origin |
| **Image optimization (next/image)** | Vercel bandwidth | WebP/AVIF auto-conversion, lazy loading |
| **Database query optimization**  | Supabase bandwidth | Indexed queries, select only needed columns |
| **Connection pooling (PgBouncer)** | Supabase connections | Supabase Pro includes this; use it |
| **Client-side data caching (SWR/React Query)** | All services | Reduce redundant API calls on navigation |
| **Pagination on all list views** | DB bandwidth       | Don't load 5,000 schools at once   |
| **Rate limiting at edge**        | All services       | Block abuse before it hits your backend |

### 2. Architecture Decisions That Save Money

| Decision                              | Why It's Cheaper                                      |
|---------------------------------------|------------------------------------------------------|
| Delete verification docs immediately  | $0 storage vs $0.02/GB/mo for persistent S3-style storage |
| Serverless over always-on server      | Pay only for actual requests, scale to zero overnight  |
| Postgres over NoSQL                   | Supabase free tier is generous; DynamoDB costs per-read |
| Redis only for rate-limiting          | Minimal commands/day vs using it as a primary cache    |
| Static generation for SEO pages       | Pennies/month vs $100s for SSR at scale               |

### 3. Emergency Cost Controls (If Costs Spike)

| Trigger                       | Action                                                  |
|-------------------------------|---------------------------------------------------------|
| Viral traffic spike           | Increase ISR cache duration to 24h+ to reduce DB hits   |
| DDoS / bot traffic            | Enable Vercel's WAF or Cloudflare free proxy            |
| Supabase bandwidth overage    | Add read replicas or move heavy reads to materialized views |
| Unexpected AI verification surge | Temporarily pause Gold verification, queue for batch processing |

---

## Funding: When and How

### Self-Funded Phase (0 - 25K users)

| Users   | Monthly Cost | Cumulative Annual | Fundable From       |
|---------|-------------|-------------------|---------------------|
| 0-1K    | ~$2.50      | ~$30              | Pocket change       |
| 1K-5K   | ~$27        | ~$318             | Skip 2 coffee/month |
| 5K-10K  | ~$60        | ~$714             | Part-time gig money |
| 10K-25K | ~$82        | ~$984             | Manageable solo     |

**You don't need funding until ~25K-50K users.** Total out-of-pocket for the entire journey from 0 to 25K users is under $1,000/year. The YC target (10K users) costs ~$60/month.

### Funding Milestones and Options

| Milestone           | Metrics Needed                          | Funding Available           | Amount        |
|---------------------|----------------------------------------|-----------------------------|---------------|
| **Friends & family** | Working product + some traction        | Personal network            | $5K-25K       |
| **Pre-seed angel**  | 1K+ users, growth trend                | Angel investors, Indie hackers | $25K-100K  |
| **YC (Fall 2026)**  | 5K outcomes, 10K users, 20% MoM growth | YC standard deal            | $500K         |
| **Seed round**      | 50K+ users, revenue signal, YC backing | VCs (post-YC)               | $1M-3M        |

### YC Timeline Mapped to Costs

| Date          | Target Users | Monthly Cost | Cumulative Spent | Funding Status     |
|---------------|-------------|-------------|-------------------|--------------------|
| Now (Feb 2026)| ~0          | ~$2.50      | ~$0               | Self-funded        |
| Jun 2026      | ~1,000      | ~$2.50      | ~$15              | Self-funded        |
| Aug 2026      | ~5,000      | ~$27        | ~$100             | Apply to YC        |
| Oct 2026      | ~10,000     | ~$60        | ~$300             | YC interview       |
| Jan 2027      | ~25,000     | ~$82        | ~$600             | YC batch ($500K)   |
| Jun 2027      | ~100,000    | ~$250       | ~$2,500           | Seed round ($1-3M) |

### When Revenue Should Kick In

| Revenue Trigger              | Timing            | Estimated Monthly Revenue |
|------------------------------|--------------------|---------------------------|
| Premium subscriptions ($9.99/mo) | At 10K+ users, ~2% convert | ~$2,000/mo (200 subs) |
| At 25K users, ~3% convert   | Post-YC            | ~$7,500/mo (750 subs)    |
| At 50K users, ~5% convert   | Growth phase        | ~$25,000/mo (2,500 subs) |
| B2B school/counselor plans   | At 50K+ users      | $30-100K/year per deal    |

**Revenue exceeds costs at ~200 paid subscribers** (~$2K/mo revenue vs ~$60-80/mo cost). With a 2-3% conversion rate, that happens around 7K-10K total users — well before you need external funding for operational costs.

---

## Summary

| Question                              | Answer                                                    |
|---------------------------------------|----------------------------------------------------------|
| When does it get expensive?           | ~$150+/mo at 25K-50K users. Painful at 100K+ without revenue. |
| How to control costs?                 | ISR caching, edge optimization, static generation — 90% of traffic is cacheable. |
| When do you need funding?             | You don't, until 50K+ users. YC at 10K users gives $500K runway. |
| Anonymous view-only cost?             | ~$0.05 per 1,000 views. 100K visitors/mo costs ~$15.     |
| How much can be view-only?            | ~70-80% of the site. All SEO pages, school lists, aggregate stats. |
| When does revenue cover costs?        | ~200 paid subscribers ($2K/mo) at ~7K-10K total users.   |
