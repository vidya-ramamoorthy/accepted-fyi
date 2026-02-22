# 004: Growth Strategy and Premium Subscriber Economics

**Date:** 2026-02-22
**Status:** Active
**Context:** Strategic analysis of the growth funnel, chances calculator ROI, premium subscriber persona, unit economics, and verification timeline.

---

## Current Cost Reality (Post-Optimization)

After implementing ISR caching, query-level caching, and connection pooling, the cost model has fundamentally shifted:

| User Action | Cost Per Action | Frequency | Who Does It |
|-------------|----------------|-----------|-------------|
| Anonymous page view | ~$0 (CDN-cached) | Very high | Everyone |
| Chances calculator query | ~$0 (cached reads) | Medium | Signed-in users |
| Account creation (auth) | $0 (Supabase free tier) | Low | Converting visitors |
| Submission (DB write) | ~$0.0001 (one INSERT) | Very low (3-5 per user, ever) | Contributing users |
| AI verification | $0 (on hold) | Zero | Nobody, for now |

**Bottom line:** Reads are free. Writes are rare. The expensive things (verification) aren't happening yet. This means we can aggressively grow the user base without cost scaling linearly.

---

## Growth Funnel: Four User Tiers

```
Anonymous Visitor (free, no sign-in)
    |
    | sees: landing page, school lists, aggregate stats, SEO pages
    | cost: ~$0 (cached static HTML)
    | hook: "Sign in to see individual profiles"
    |
    v
Signed-In, No Submission (free account)
    |
    | sees: above + chances calculator + school detail official data
    | cost: ~$0 (cached reads)
    | hook: "Submit your result to unlock community data"
    |
    v
Signed-In, Has Submitted (free, data contributor)
    |
    | sees: above + individual crowdsourced profiles (basic view)
    | cost: ~$0.001/month (occasional uncached reads)
    | hook: "Upgrade for advanced filters, comparisons, exports"
    |
    v
Premium Subscriber ($9.99/month)
    |
    | sees: everything + advanced filters + school comparisons +
    |       historical trends + data export + priority support
    | cost: ~$0.02-0.05/month to serve
    | margin: ~99.5%
```

---

## Chances Calculator: Strategic Value

### Why Build It Now

| Reason | Explanation |
|--------|-------------|
| **Underclassman hook** | Freshmen/sophomores have no results to submit. Without the calculator, they have zero reason to sign up. With it, they create accounts 1-2 years before contributing data. |
| **Cheapest feature to operate** | Read-only queries against cached aggregate data. No writes, no storage, no verification. |
| **Account creation driver** | Requires sign-in but not a submission. Grows MAU count for YC metrics without needing the user to have admissions results yet. |
| **Premium upsell anchor** | Free tier: basic Reach/Match/Safety categorization. Premium tier: detailed breakdowns by round, major, demographic, with confidence intervals. Natural paywall. |
| **Data collection** | Even without submitting, the calculator captures the user's GPA, test scores, target schools, and state. This is valuable profile data that enriches the dataset. |
| **Engagement loop** | "Your chances at Stanford: 12% (based on 47 similar profiles)" — users come back to check as they improve scores or add APs. Repeat visits = retention. |

### Chances Calculator Cost to Serve

| Component | Cost | Notes |
|-----------|------|-------|
| DB read (aggregate stats) | ~$0 | Cached with `unstable_cache`, revalidated every 30 min |
| Serverless compute | ~$0.00001 | Simple comparison logic, <50ms execution |
| Bandwidth | ~$0.00004 | ~300 KB response |
| **Total per calculation** | **~$0.00005** | **$0.05 per 1,000 calculations** |

At 10,000 users running 5 calculations/month each: **~$2.50/month**. Negligible.

### What the Free Calculator Shows vs Premium

| Feature | Free | Premium ($9.99/mo) |
|---------|------|---------------------|
| Reach / Match / Safety categorization | Yes | Yes |
| Number of similar profiles matched | Yes | Yes |
| Acceptance rate for similar profiles | Yes | Yes |
| Breakdown by application round (EA/ED/RD) | No | Yes |
| Breakdown by intended major | No | Yes |
| Historical trend (improving/declining) | No | Yes |
| Confidence interval | No | Yes |
| "What would improve my chances" suggestions | No | Yes |
| School-by-school detailed comparison | No | Yes |
| Export as PDF/spreadsheet | No | Yes |

---

## Premium Subscriber: Who, What, Why

### Who Pays $9.99/month

| Persona | % of Subscribers | Why They Pay | Lifetime |
|---------|-----------------|--------------|----------|
| **Parents of juniors/seniors** | ~45% | Already spending $2K+ on test prep, $100+ on essay coaches. $10/mo is rounding error for "will my kid get in?" anxiety. | 6-18 months |
| **Shotgun applicants** (15-25 schools) | ~25% | Applying to 15+ schools, need detailed comparison data to prioritize. The more schools, the more valuable the data. | 3-8 months (application season) |
| **Independent college counselors** | ~15% | Use the data with clients. $10/mo is a business expense. May upgrade to B2B plan later. | 12+ months (ongoing) |
| **Transfer/reapplicants** | ~10% | Gap year students, transfer applicants. Need historical data to benchmark against. | 3-6 months |
| **Data enthusiasts/college nerds** | ~5% | The "I'm a sophomore but I've already made a spreadsheet" crowd. Long-term engaged users. | 12+ months |

### Average Subscriber Economics

| Metric | Value |
|--------|-------|
| Monthly subscription | $9.99 |
| Average retention | ~5 months (seasonal — peaks Sep-Apr) |
| Lifetime value (LTV) | ~$50 |
| Stripe processing fee (2.9% + $0.30) | ~$0.59/month |
| Infrastructure cost to serve | ~$0.02-0.05/month |
| **Net revenue per subscriber/month** | **~$9.35** |
| **Gross margin** | **~93.6%** (after Stripe) |
| **Net margin** | **~93.1%** (after Stripe + infra) |

### What Premium Subscribers See

#### 1. Advanced Filters (the big one)
Free users can browse by school. Premium users can cross-filter:
- GPA range + SAT range + state + decision + round + major + high school type
- "Show me accepted students at Stanford with 3.8+ GPA, 1500+ SAT, from public high schools in California who applied Regular Decision"
- This is the query that answers "am I competitive?" — and it's worth $10/mo to anxious families

#### 2. Individual Profile Deep Dives
Free users see aggregate stats (acceptance rate, avg GPA). Premium users see:
- Every individual submission with full detail (extracurriculars, AP count, honors, first-gen status, etc.)
- Filterable and sortable submission tables
- "Profiles like mine" — pre-filtered to similar stats

#### 3. School Comparison Tool
- Side-by-side comparison of 2-5 schools
- Official data + community data + chances calculator results in one view
- Exportable as PDF for family discussions

#### 4. Historical Trends
- Acceptance rate trends across admission cycles
- "Stanford's community-reported accept rate went from 15% to 12% over 3 cycles"
- Score inflation tracking (avg SAT of accepted students over time)

#### 5. Data Export
- Download filtered results as CSV/PDF
- Counselors use this with students
- Parents use this for family planning

#### 6. Enhanced Chances Calculator
- All the premium calculator features listed above
- Saved profiles: "Check my chances" bookmark that updates as new data comes in
- Push notification: "New data for your target schools — your chances updated"

### Cost to Serve a Premium Subscriber

Premium users are heavier readers but still cheap to serve:

| Activity | Frequency/Month | Cost Per | Monthly Cost |
|----------|----------------|----------|-------------|
| Page views (cached) | ~80 | $0.00004 | $0.003 |
| Advanced filter queries | ~30 | $0.0001 | $0.003 |
| Chances calculations | ~10 | $0.00005 | $0.0005 |
| Individual profile views | ~50 | $0.00005 | $0.0025 |
| Comparison tool | ~5 | $0.0002 | $0.001 |
| Data exports (CSV gen) | ~2 | $0.001 | $0.002 |
| **Total infrastructure** | | | **~$0.012/month** |
| Stripe fees | | | ~$0.59/month |
| **Total cost per subscriber** | | | **~$0.60/month** |

**Revenue per subscriber: $9.99. Cost: $0.60. Margin: $9.39 (94%).**

---

## Revenue Milestones

| Subscribers | Monthly Revenue | Monthly Cost (infra + Stripe) | Net Revenue | Covers |
|-------------|----------------|-------------------------------|-------------|--------|
| 50 | $500 | $30 | $470 | All infrastructure at 10K users |
| 200 | $2,000 | $120 | $1,880 | Full operational costs + domain + Apple Dev |
| 500 | $5,000 | $300 | $4,700 | Part-time salary equivalent |
| 1,000 | $10,000 | $600 | $9,400 | Full-time ramen profitability |
| 2,500 | $25,000 | $1,500 | $23,500 | Small team (2-3 people) |

### Conversion Rate Expectations

| Total Users | Expected Conversion Rate | Subscribers | Monthly Revenue |
|-------------|------------------------|-------------|-----------------|
| 5,000 | 1-2% | 50-100 | $500-1,000 |
| 10,000 | 2-3% | 200-300 | $2,000-3,000 |
| 25,000 | 3-4% | 750-1,000 | $7,500-10,000 |
| 50,000 | 4-5% | 2,000-2,500 | $20,000-25,000 |

Conversion rates increase with scale because more data = more value = higher willingness to pay.

---

## Verification: When to Turn It On

### Current Status: On Hold

Verification (Gold tier via AI document review) costs ~$0.01 per document. The cost isn't the issue — the issue is that it's premature:

| Reason to Wait | Explanation |
|----------------|-------------|
| **Not enough users to need trust** | With <1,000 submissions, community flagging + anomaly detection is sufficient. Users can self-police. |
| **Bronze data is good enough** | Reddit-scraped data and self-reported data is clearly labeled. Users understand the caveat. |
| **Engineering effort vs. payoff** | Building the upload flow, AI extraction, and redaction tool is 2-3 weeks of work for a feature that serves <1% of users right now. |
| **Privacy risk** | Handling admission letters, even transiently, introduces PII risk. Better to wait until there's a legal/compliance review. |

### When to Enable Verification

| Trigger | Action |
|---------|--------|
| 5,000+ user submissions | Enable Silver tier (.edu email verification) — cheap, no AI needed |
| 10,000+ submissions AND premium revenue | Enable Gold tier (document verification) — fund AI costs from subscription revenue |
| Community trust complaints | If users start questioning data quality, fast-track verification as a trust signal |
| YC batch acceptance | Build it as a "Demo Day feature" to show investors the trust moat |

### Verification Cost at Scale

| Users | Gold Verifications (~10% of users) | Monthly AI Cost | Funded By |
|-------|-------------------------------------|-----------------|-----------|
| 5,000 | 500 | ~$5 | Premium revenue ($500+) |
| 10,000 | 1,000 | ~$10 | Premium revenue ($2,000+) |
| 25,000 | 2,500 | ~$25 | Premium revenue ($7,500+) |

Verification costs are always <1% of premium revenue. It pays for itself many times over.

---

## Strategic Priorities (Ordered)

| Priority | Feature | Why Now | Cost | Impact |
|----------|---------|---------|------|--------|
| 1 | **Chances calculator (free tier)** | Drives sign-ups, hooks underclassmen, costs nothing to serve | ~$0/month | High — grows MAU for YC |
| 2 | **Premium subscription (Stripe)** | Revenue before funding, proves willingness to pay | ~$50 Stripe setup | High — validates business model |
| 3 | **Advanced filters (premium)** | The #1 reason people would pay, directly monetizes existing data | Dev time only | High — drives conversion |
| 4 | **Silver verification (.edu)** | Low-effort trust signal, no AI cost | Dev time only | Medium — improves data trust |
| 5 | **School comparison tool (premium)** | Differentiator, high perceived value | Dev time only | Medium — reduces churn |
| 6 | **Gold verification (AI)** | Wait until 10K+ submissions and premium revenue | ~$10/mo at 10K users | Low priority now |
| 7 | **Data export (premium)** | Easy to build, counselors love it | Dev time only | Low — niche feature |

---

## Key Takeaways

1. **The chances calculator is the highest-ROI feature to build next.** Near-zero cost, drives sign-ups for users who don't have results yet, and creates the natural premium upsell.

2. **Premium subscribers cost ~$0.60/month to serve and pay $9.99.** That's 94% margin. You need just 50 subscribers to cover all infrastructure costs at 10K users.

3. **Verification should stay on hold.** Bronze + community flagging is sufficient. Enable Silver (.edu) at 5K users, Gold (AI) at 10K. Verification costs are always <1% of premium revenue.

4. **The business model works because reads are free.** After the caching optimizations, the entire read path (anonymous browsing, chances calculator, school comparisons) is served from cache. Only writes (submissions) and AI (verification) cost money, and both are rare.

5. **Parents are the primary paying customer**, not students. Price accordingly — $10/mo is less than one hour of test tutoring. Marketing should target parent anxiety, not student curiosity.
