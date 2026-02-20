# accepted.fyi Growth & Marketing Strategy

## Table of Contents
1. [Lessons from Levels.fyi and Blind](#lessons-from-levelsfyi-and-blind)
2. [Phase 1: Pre-Launch Seeding (0-500 users)](#phase-1-pre-launch-seeding-0-500-users)
3. [Phase 2: Decision Season Blitz (500-5,000 users)](#phase-2-decision-season-blitz-500-5000-users)
4. [Phase 3: SEO & Content Flywheel (5,000-25,000 users)](#phase-3-seo--content-flywheel-5000-25000-users)
5. [Phase 4: Viral Mechanics & Network Effects (25,000-100,000 users)](#phase-4-viral-mechanics--network-effects-25000-100000-users)
6. [Phase 5: Monetization & B2B (100,000+ users)](#phase-5-monetization--b2b-100000-users)
7. [Seasonal Calendar](#seasonal-calendar)
8. [Key Metrics to Track](#key-metrics-to-track)

---

## Lessons from Levels.fyi and Blind

### How Levels.fyi Scaled (2017-2023)
- **Year 1-2:** Used Google Forms + Google Sheets. Zero infrastructure cost. Focused 100% on data collection.
- **Guerrilla seeding:** Founders manually posted on Blind (anonymous professional network) and TeamBlind forums, asking "what's your compensation at Google L5?" Controversial, attention-grabbing.
- **SEO moat:** Auto-generated pages like "Google L5 Software Engineer Salary" ranked on Google within months. Now 2.5M monthly visits, 80%+ from organic search.
- **Tipping point:** Hit ~10M cells in Google Sheets (2019), forcing migration to AWS RDS Postgres. By then, the data moat was established.
- **Lesson:** You don't need a fancy product. You need data first. The product follows the data.

### How Blind Scaled (2013-2020)
- **Korean BBQ parties:** Hosted free Korean BBQ dinners for Amazon employees. Asked attendees to invite 5 coworkers. Got first 100 users at Amazon.
- **Company-specific communities:** Created communities per company (Amazon, Google, Meta). Employees shared internal drama anonymously. Self-reinforcing loop.
- **Uber scandal (2017):** Susan Fowler's blog post about Uber's toxic culture went viral. Blind became the go-to platform for anonymous workplace discussion. Tripled user base in months.
- **Patented email verification:** Used work email hashing to verify employment without storing emails. Built trust.
- **Lesson:** Find the controversy. Find the moment people desperately want to share but are afraid to publicly. Be the safe outlet.

---

## Phase 1: Pre-Launch Seeding (0-500 users)

### Timeline: March-April 2026 (Regular Decision season)

### Strategy: Manual, Personal, One-on-One

1. **Personal network seeding**
   - Reach out to 50 friends, classmates, and acquaintances who recently went through college admissions
   - Ask each to submit their data AND invite 3 friends
   - Target: 150-200 initial data points from personal network alone

2. **High school counselor outreach**
   - Email 20-30 high school counselors at competitive schools
   - Pitch: "Free tool that helps your students understand admissions data"
   - Offer to share anonymized aggregate data back to them
   - Each counselor influences 100-300 seniors

3. **College freshman outreach (warm leads)**
   - Target freshmen at top 50 schools (they just went through admissions)
   - Post in school-specific subreddits, Discord servers, GroupMe chats
   - Message: "Hey, I built a free tool to help high schoolers see real admissions data. Would you share yours? Takes 2 min."
   - Focus on class of 2029/2030 freshmen

4. **"Korean BBQ" equivalent**
   - Host virtual "Decision Day Watch Parties" on Discord
   - Free pizza delivered to participants who submit their data (limit 20/event, ~$200 budget)
   - Record the event, clip highlights for TikTok/YouTube Shorts

### Target Data Points: 500 submissions across 30+ schools

---

## Phase 2: Decision Season Blitz (500-5,000 users)

### Timeline: March-May 2026

### Strategy: Platform-Specific Guerrilla Marketing

1. **Reddit (r/ApplyingToCollege, r/CollegeResults, r/chanceme)**
   - r/ApplyingToCollege: 750K+ members, peak activity during decision season
   - r/CollegeResults: People already voluntarily post their stats + results
   - Post format: "I built a free, anonymous version of CollegeResults where you can filter and compare. Link in comments."
   - Create a bot or tool that says "Want to see how your stats compare? Check accepted.fyi"
   - **Key rule:** Provide value first. Don't just spam links. Answer questions, share insights from the data, then mention the tool.

2. **Discord servers**
   - Join top 20 college admissions Discord servers
   - Share school-specific data insights: "28 Stanford EA submissions on accepted.fyi — average SAT is 1530, 3 were below 1450"
   - The specificity makes it feel like insider data

3. **TikTok / YouTube Shorts / Instagram Reels**
   - "I analyzed 1,000 MIT applications. Here's what the accepted students had in common."
   - "The real stats that got people into Stanford (not the Reddit version)"
   - "Your GPA is 3.7 UW? Here's your chances at every Ivy."
   - Use data from the platform to create content. Each video drives traffic back.
   - Target hashtags: #collegeadmissions, #ivyleague, #classof2030, #decisionday

4. **College Confidential forums**
   - Still has 5M+ monthly visits despite feeling dated
   - Post in school-specific "Results" threads
   - Position as the modern alternative: "Instead of scrolling through hundreds of unstructured posts, see it all in one searchable database"

5. **Twitter/X admissions community**
   - Quote-tweet college decision viral moments
   - Share data-driven insights: "Acceptance rate for ED applicants with 4.0+ GPA at Duke: X% (based on our data)"
   - Engage with admissions consultants, tutoring companies, education journalists

### Target: 5,000 submissions, 2,000+ active users

---

## Phase 3: SEO & Content Flywheel (5,000-25,000 users)

### Timeline: June-December 2026

### Strategy: Programmatic SEO + Content Marketing

1. **Programmatic SEO pages (the levels.fyi playbook)**
   - Auto-generate thousands of pages from data:
     - `accepted.fyi/schools/stanford` — Stanford admissions stats page
     - `accepted.fyi/schools/stanford/computer-science` — Stanford CS admissions
     - `accepted.fyi/compare/stanford-vs-mit` — School comparison
     - `accepted.fyi/stats/1500-sat-acceptance-rates` — "What schools can I get into with a 1500 SAT?"
     - `accepted.fyi/states/california` — California applicant outcomes
   - **Long-tail keywords:** "MIT acceptance rate for 1500 SAT," "Stanford average GPA accepted students," "chances of getting into Harvard with 3.8 GPA"
   - These queries have HIGH volume during admissions season and LOW competition (no one has structured individual-level data)

2. **Blog content**
   - Annual reports: "2026 Admissions Season: Key Trends from 10,000 Data Points"
   - School-specific deep dives: "Inside Stanford Admissions: What Our Data Shows"
   - Myth-busting: "Does Early Decision Really Help? Our Data Says..."
   - Each post targets specific search queries and links to the platform

3. **Backlink strategy**
   - Reach out to education journalists (NYT Education, The Atlantic, etc.)
   - Pitch: "We have the largest open database of individual college admissions outcomes"
   - Offer exclusive data for articles
   - Every news mention = high-authority backlinks = better SEO

4. **Email newsletter**
   - "Weekly Admissions Insights" newsletter
   - Data-driven content from the platform
   - Sent during admissions season (September-April)
   - Re-engages users who submitted last year to update/verify

### SEO Target: Rank top 3 for 500+ college admissions long-tail queries

---

## Phase 4: Viral Mechanics & Network Effects (25,000-100,000 users)

### Built-In Viral Loops

1. **"Post to View" gate (already built)**
   - Users must submit their own data to see others'
   - Every new viewer becomes a contributor
   - Self-reinforcing: more data = more visitors = more data

2. **Decision Day shareable cards**
   - Auto-generate beautiful, shareable cards when a user submits:
     ```
     [accepted.fyi card]
     Stanford University — Accepted!
     GPA: 3.92 | SAT: 1540 | ED
     "See more Stanford results at accepted.fyi"
     ```
   - Users share on Instagram Stories, Twitter, TikTok
   - Each shared card drives 5-15 new visitors

3. **School-level leaderboards**
   - "Top 10 schools with most submissions"
   - "Which school's accepted students have the highest average SAT?"
   - Creates competition between school communities to contribute more data

4. **"Compare Yourself" tool**
   - Enter your stats, see where you'd likely be accepted/rejected based on historical data
   - Highly shareable: "I compared my stats on accepted.fyi — turns out I had a 65% chance at UCLA and only 12% at Stanford"
   - This is the #1 thing applicants want to know

5. **Referral incentives**
   - "Invite 3 friends who submit → unlock advanced filters (GPA range, major-specific)"
   - Free features gated behind referrals, not payments
   - At this stage, growth > revenue

### Network Effect Dynamics
- **Data network effect:** More submissions = more useful = more visitors = more submissions
- **School network effect:** Once a school has 50+ data points, it becomes the definitive source for that school's admissions data
- **Cross-school effect:** Users who submit for one school often submit for 5-8 schools (multiple applications)

---

## Phase 5: Monetization & B2B (100,000+ users)

### Timeline: 2027+

1. **Freemium model ($9.99/mo or $59.99/yr)**
   - Free: Basic browsing, standard filters
   - Premium: Advanced filters (major-specific, by extracurricular type, multi-year trends), individual profile deep-dives, export data

2. **Admissions consulting marketplace**
   - Verified admissions consultants can offer services through the platform
   - Platform takes 15-20% commission
   - Consultants get access to the data for their advisory work
   - Follow the levels.fyi → compensation consulting pipeline

3. **B2B: Schools & counselors ($30-100K/year per district)**
   - Dashboard for school counselors showing anonymized admissions trends
   - "Students from your school with X GPA and Y SAT had Z% acceptance rate at these schools"
   - Replaces Naviance's outdated, school-locked model

4. **B2B: Test prep companies (lead gen)**
   - Partner with Princeton Review, Kaplan, Khan Academy
   - "Your SAT is 1350. Students accepted to your target schools averaged 1480. Improve your score with [partner]."
   - CPA model: $10-50 per qualified lead

5. **Data licensing**
   - Aggregate, anonymized data sold to:
     - Education researchers
     - College ranking organizations (U.S. News, Niche)
     - Policy think tanks studying admissions equity

---

## Seasonal Calendar

The college admissions cycle creates natural demand waves:

| Month | Activity | Marketing Focus |
|-------|----------|-----------------|
| **Sep-Oct** | ED/EA applications due | "Submit your decision when you get it" pre-registration |
| **Nov-Dec** | ED/EA decisions released | Target ED/EA decision threads on Reddit/Discord |
| **Jan-Feb** | RD applications submitted, waiting | "Compare your stats" tool promotion |
| **Mar-Apr** | **RD decisions released (PEAK)** | **Maximum marketing push.** Decision Day content, TikToks, Reddit |
| **May** | Commitment decisions (May 1 deadline) | "Final results" push, year-in-review content |
| **Jun-Aug** | Off-season | SEO content, blog posts, backlink building, product improvements |

### Key Dates to Target
- **March 14-28:** Ivy Day + most T20 decisions
- **April 1:** Many state school decisions
- **May 1:** National College Decision Day
- **November 15:** ED deadline (start re-engagement)
- **December 15-20:** ED decisions released

---

## Key Metrics to Track

### Growth Metrics
| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|---------------|---------------|---------------|
| Total submissions | 500 | 5,000 | 25,000 |
| Active users (MAU) | 200 | 2,000 | 15,000 |
| Schools with 10+ data points | 15 | 100 | 300 |
| Month-over-month growth | — | 30%+ | 20%+ |
| Organic search traffic | — | 5,000/mo | 50,000/mo |

### Engagement Metrics
- **Submission-to-browse ratio:** What % of users who submit actually come back to browse? Target: 70%+
- **Multi-submission rate:** What % of users submit for 3+ schools? Target: 60%+
- **Referral rate:** What % of users invite at least 1 friend? Target: 15%+
- **Return rate:** What % of users come back within 7 days? Target: 40%+

### Data Quality Metrics
- **Verification rate:** What % of submissions are Silver or Gold tier? Target: 25%+ by Phase 3
- **Flag rate:** What % of submissions get flagged? Target: < 5%
- **Duplicate rate:** What % of school entries are duplicates? Track for data cleanup

### YC Application Metrics (Target: Fall 2026)
- 5,000+ outcomes in the database
- 10,000+ registered users
- 20%+ month-over-month growth during decision season
- Evidence of data network effect (more data → more users → more data)
- Revenue not required, but a path to monetization must be clear

---

## Budget Estimates (First Year)

| Category | Monthly | Annual |
|----------|---------|--------|
| Infrastructure (Vercel + Supabase + Upstash) | $0-25 | $0-300 |
| Domain (accepted.fyi) | — | $15-20 |
| Apple Developer Account | — | $99 |
| Pizza/food for seeding events (Phase 1) | $200 (one-time) | $200 |
| TikTok/Instagram boosted posts (Phase 2) | $50-100 | $600-1,200 |
| SEO tools (Ahrefs or similar, Phase 3) | $99 | $1,188 |
| **Total first year** | | **~$1,500-3,000** |

The beauty of this model is that the primary marketing channel (user-generated data + SEO) is free. Paid marketing is optional and supplementary.
