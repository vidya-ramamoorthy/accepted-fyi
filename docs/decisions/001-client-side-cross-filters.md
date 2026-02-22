# ADR-001: Client-Side Cross-Filters for Programmatic SEO Pages

**Date:** 2026-02-22
**Status:** Implemented

## Context

The programmatic SEO pages (state, SAT range, ACT range, acceptance rate) each filter by one dimension server-side. Users landing on e.g. `/colleges/act/34-36` want to further narrow by state, acceptance rate, or school type without navigating away.

All pages already load the full school list via `SCHOOL_CARD_SELECT`, which includes every field needed for cross-filtering (state, acceptanceRate, satAverage, sat25th/75th, actMedian, act25th/75th, schoolType). No additional database queries are needed.

## Decision

Filter entirely client-side with a single reusable `FilterableSchoolGrid` component. Each server page passes its full school array and a `hideFilter` prop to suppress the dropdown for the dimension the page already filters by.

### Why client-side instead of server-side / URL params

- **Zero additional DB queries** — data is already fetched and serialized to the page
- **Instant feedback** — no network round-trip on filter change
- **Simpler implementation** — no URL state management, no new API routes
- **SEO unaffected** — the server-rendered page still has the full school list for crawlers; filters are progressive enhancement

### Trade-offs accepted

- Pages with very large school lists (e.g. some states with 200+ schools) send all data upfront. This is acceptable because `SchoolCard` data is lightweight (~200 bytes per school) and the pages are statically generated / ISR cached.
- Filter state is not URL-persisted, so it resets on page reload. This is fine for exploratory browsing; deep-linking to filtered views can be added later if needed.

## Implementation

### Files changed

| File | Action |
|------|--------|
| `src/components/schools/FilterableSchoolGrid.tsx` | Created |
| `src/app/colleges/state/[stateSlug]/page.tsx` | Modified |
| `src/app/colleges/sat/[range]/page.tsx` | Modified |
| `src/app/colleges/act/[range]/page.tsx` | Modified |
| `src/app/colleges/acceptance-rate/[range]/page.tsx` | Modified |

### Component design

`FilterableSchoolGrid` is a `"use client"` component with props:
- `schools: SchoolData[]` — the full list from the server page
- `hideFilter?: "state" | "sat" | "act" | "acceptanceRate" | "schoolType"` — hides one dropdown

Five filter dropdowns (each optional via `hideFilter`):
- **State** — matches `school.state` against US state abbreviation
- **Acceptance Rate** — checks `parseFloat(school.acceptanceRate)` within range bounds
- **SAT Score** — checks if school's SAT 25th-75th percentile range overlaps selected range
- **ACT Score** — checks if school's ACT 25th-75th percentile range overlaps selected range
- **School Type** — matches `school.schoolType` (public / private / community_college)

Filtering uses `useMemo` keyed on all filter states for performance. Includes "Showing X of Y schools" counter and "Clear filters" button.

### Page integration pattern

Each page replaced its `<div className="grid">` of `SchoolCard` components with:
```tsx
<FilterableSchoolGrid schools={schools} hideFilter="<dimension>" />
```

## Verification

- `/colleges/act/34-36` — shows State, Acceptance Rate, SAT, School Type dropdowns (ACT hidden)
- `/colleges/state/california` — shows Acceptance Rate, SAT, ACT, School Type dropdowns (State hidden)
- Selecting filters instantly narrows the list; count updates
- "Clear filters" resets to full list
- Empty state shown when no schools match filters
