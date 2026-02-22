# 003: Cost Reduction Implementation Plan

**Date:** 2026-02-22
**Status:** In Progress
**Context:** Concrete code changes to reduce infrastructure costs by minimizing DB queries, serverless invocations, and bandwidth for anonymous/view-only traffic.

---

## Design Decisions

### 1. ISR (Incremental Static Regeneration) for All Public Pages

**Problem:** Programmatic SEO pages (`/colleges/sat/[range]`, `/colleges/act/[range]`, `/colleges/acceptance-rate/[range]`, `/colleges/state/[stateSlug]`) use `generateStaticParams` but have no `revalidate` interval. They only regenerate on full redeploy, meaning stale data until the next deployment.

**Decision:** Add `export const revalidate = 3600` (1 hour) to all programmatic SEO pages. This enables ISR — pages are served from cache and rebuilt in the background at most once per hour.

**Cost impact:** After initial generation, subsequent visitors get a cached static HTML response. No serverless function execution, no DB query. At 100K anonymous views/month, this saves ~$10-15/month in serverless compute.

**Files changed:**
- `src/app/colleges/sat/[range]/page.tsx`
- `src/app/colleges/act/[range]/page.tsx`
- `src/app/colleges/acceptance-rate/[range]/page.tsx`
- `src/app/colleges/state/[stateSlug]/page.tsx`

---

### 2. Convert School Detail Page from `force-dynamic` to ISR

**Problem:** `/schools/[slug]` uses `export const dynamic = "force-dynamic"`, meaning every page view triggers 3-4 DB queries (school data, submissions, decision timelines). Most of this data (institutional stats, CDS data) is static and changes at most once a day.

**Decision:** Remove `force-dynamic` and add `export const revalidate = 1800` (30 minutes). Pair with `unstable_cache` on the `getSubmissionsForSchool` query to ensure fresh community data while caching institutional data.

**Cost impact:** The school detail page is the most expensive page to serve. With ~5,000 schools and multiple page views each, converting to ISR saves the majority of DB reads. Estimated saving: 60-80% reduction in DB queries from this page alone.

**Trade-off:** Community submission data may be up to 30 minutes stale. Acceptable because new submissions already have a 2-hour pending_review delay, so real-time freshness isn't expected.

**Files changed:**
- `src/app/schools/[slug]/page.tsx`
- `src/lib/db/queries/submissions.ts` (add cached wrapper)

---

### 3. Query-Level Caching with `unstable_cache`

**Problem:** Every page render executes DB queries from scratch, even for identical data that hasn't changed. `getSubmissionsForSchool`, `getSchoolsByState`, and aggregate stat queries are called repeatedly for the same inputs.

**Decision:** Wrap expensive read queries with Next.js `unstable_cache()`:
- `getSubmissionsForSchool` → cached 30 minutes, tagged `school-submissions-{schoolId}`
- `getSchoolsByState` → cached 1 hour, tagged `schools-state-{state}`
- `getStateAggregateStats` → cached 1 hour, tagged `schools-state-{state}`
- `getSchoolsBySatRange` → cached 1 hour, tagged `schools-sat`
- `getSchoolsByActRange` → cached 1 hour, tagged `schools-act`
- `getSchoolsByAcceptanceRate` → cached 1 hour, tagged `schools-acceptance-rate`

**Revalidation strategy:** When a new submission is created via `POST /api/submissions`, call `revalidateTag('school-submissions-{schoolId}')` to bust the cache for that specific school.

**Cost impact:** Reduces DB reads by 80-90% for repeat visitors to the same pages. At scale, this is the single biggest cost saver.

**Files changed:**
- `src/lib/db/queries/submissions.ts`
- `src/lib/db/queries/schools.ts`
- `src/app/api/submissions/route.ts` (add revalidateTag on POST)

---

### 4. Cache-Control Headers on Public API Routes

**Problem:** GET `/api/schools` and GET `/api/schools/autocomplete` return no caching headers. Every API call hits the serverless function and DB, even for identical queries within seconds.

**Decision:** Add `Cache-Control` headers to public read-only API routes:
- `GET /api/schools` → `Cache-Control: public, s-maxage=300, stale-while-revalidate=600` (5 min CDN cache)
- `GET /api/schools/autocomplete` → `Cache-Control: public, s-maxage=60, stale-while-revalidate=120` (1 min CDN cache)
- `GET /api/submissions` → `Cache-Control: private, s-maxage=60` (1 min, private because auth-gated)

**Cost impact:** Reduces serverless invocations for repeat API calls. Especially impactful for autocomplete, which fires on every keystroke.

**Files changed:**
- `src/app/api/schools/route.ts`
- `src/app/api/schools/autocomplete/route.ts`
- `src/app/api/submissions/route.ts`

---

### 5. Pagination for School Detail Submissions

**Problem:** `/schools/[slug]` loads ALL submissions for a school via `getSubmissionsForSchool`. For popular schools with 1,000+ submissions, this is a large DB query and a large HTML payload.

**Decision:** Add server-side pagination to `getSubmissionsForSchool` with a default of 20 submissions per page. Show a "Load more" button for additional pages.

**Cost impact:** Reduces initial page payload by ~95% for schools with many submissions. Smaller responses = less bandwidth = less Vercel cost.

**Files changed:**
- `src/lib/db/queries/submissions.ts` (add pagination params)
- `src/app/schools/[slug]/page.tsx` (paginate submission list)

---

## Implementation Order

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 1 | Add ISR to programmatic SEO pages | High | 5 min |
| 2 | Add `unstable_cache` to DB queries | High | 30 min |
| 3 | Convert school detail page to ISR | High | 15 min |
| 4 | Add Cache-Control headers to API routes | Medium | 10 min |
| 5 | Add pagination to school submissions | Medium | 30 min |

---

## Expected Cost Savings

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| DB queries per anonymous page view | 1-4 | 0 (cached) | ~95% |
| Serverless invocations (SEO pages) | Every visit | 1/hour per page | ~99% |
| School detail page DB queries | Every visit | 1/30 min per school | ~98% |
| API response bandwidth | Full on every call | CDN-cached | ~70% |
| Submission payload size | All rows | 20 per page | ~95% |

**Net effect:** These changes push the cost cliff from ~$60/mo at 10K users to ~$60/mo at 25K-30K users, effectively doubling the free runway.
