# Go-to-Market Strategy — accepted.fyi

*Last updated: February 2026*

## Current Timing (February 20, 2026)

We are in the **best possible launch window** for a college admissions data platform.

### What's Already Happened
- **ED1 decisions**: Released mid-December 2025 (all Ivies, Duke, Northwestern, etc.)
- **REA decisions**: Released mid-December 2025 (Stanford, Harvard, Yale, Princeton)
- **EA decisions**: Released December 2025 - January 2026 (MIT, UChicago, Caltech, Georgetown, UVA, UMich)
- **ED2 decisions**: Releasing NOW (mid-February 2026) — Vanderbilt, WashU, Emory, Tufts, Pomona, Bowdoin, etc.

### What's Coming (The Opportunity)
| Date | Event | Opportunity |
|------|-------|-------------|
| **Mar 14** | MIT decisions (Pi Day, 6:28pm ET "Tau time") | First major RD wave. Be live by this date. |
| **Mid-March** | Caltech, Georgetown, Duke RD | Growing wave of decisions |
| **Mar 26** | Ivy Day (Yale confirmed; all Ivies expected) | BIGGEST single day of decisions. Peak emotional moment. |
| **Late Mar** | Stanford RD (typically end of March, Friday) | High-profile, high-engagement |
| **Apr 1** | Georgetown RD, many state schools | Continued wave |
| **Apr 1-15** | UC decisions (Berkeley, UCLA, etc.) | MASSIVE volume — 130K+ applicants per UC |
| **May 1** | National College Decision Day | Everyone commits. Final push for "where are you going?" data |

### Why This Timing Matters
- 3-4 weeks to prepare before the RD tsunami
- Students are anxiously refreshing portals, checking Reddit, Googling "[school] acceptance rate"
- r/ApplyingToCollege (650K+ members) explodes with activity during this window
- Decision Day shareable culture already exists on TikTok/Instagram — we just need to give it structure

---

## Single School Strategy: Seed One Community First

### Why One School First
- Trying to launch for "all schools" means being empty everywhere
- Density at one school is more compelling than 1-2 data points at 100 schools
- "47 submissions for Stanford" is interesting. "1 submission each for 47 schools" is not.

### Recommended Target: UC Berkeley or UCLA

**Why UCs:**
- Largest applicant pools in the country (~130,000+ applications each)
- ALL applicants are Regular Decision (no ED for UCs) — one massive wave
- Huge Reddit/Discord presence — California students are extremely data-driven and online
- UC decisions are BY MAJOR — which makes the data even more compelling ("CS vs English acceptance rate at Berkeley")
- Decisions release mid-to-late March → early April
- Geographic concentration (California) makes local marketing easier

**Alternative: MIT (Pi Day)**
- Decisions on March 14 — earliest major RD release
- High emotional engagement (the Pi Day tradition is famous)
- Smaller applicant pool (~26K) but extremely engaged community
- Could be the "proof of concept" school before UC wave hits 2 weeks later

### The Play
1. Pre-seed the school page with College Scorecard institutional data (acceptance rate, SAT ranges, class size) so it looks alive before users submit
2. Be ready on decision day with a clean, fast school detail page
3. Post in the school's r/ApplyingToCollege megathread within MINUTES of decisions dropping
4. Pitch: "I built a structured tracker to see how your stats compare to others who applied. Takes 30 seconds to add yours."
5. Every submission makes the page more interesting → more people submit → flywheel

---

## Lean Launch Plan (3-Week Sprint)

### Week 1 (Feb 21 - Feb 28): Data Foundation
- [ ] Integrate College Scorecard API — ingest institutional stats (acceptance rate, SAT/ACT ranges, enrollment, class size) for top 250 schools
- [ ] Store data by state (enables "California admissions data" SEO pages)
- [ ] Pre-populate school detail pages with institutional data
- [ ] Build decision timeline component (show when each school's decisions come out)
- [ ] Seed a few test submissions to make the platform feel alive

### Week 2 (Mar 1 - Mar 7): Viral Features
- [ ] Build shareable Decision Day cards (auto-generated image per submission)
- [ ] Add Instagram/TikTok-optimized share buttons
- [ ] Build the "post to view" gate (aggregate stats public, individual profiles require sign-in + submission)
- [ ] Create `/chances` page (basic version — input GPA/SAT, see which schools match)
- [ ] Set up Vercel Analytics and basic event tracking

### Week 3 (Mar 8 - Mar 14): Launch Prep
- [ ] Write Reddit post drafts for r/ApplyingToCollege, r/CollegeResults, r/chanceme
- [ ] Join 10-15 admissions Discord servers
- [ ] Prepare TikTok/Instagram content (data-driven stats from seeded data)
- [ ] Create a "decision calendar" page showing all upcoming RD dates
- [ ] Soft launch with personal network (10-20 seed submissions)
- [ ] **March 14: MIT Pi Day — GO LIVE**

### Weeks 4-8 (Mar 15 - Apr 30): Decision Season Blitz
- [ ] Post in every major school's decision megathread on Reddit
- [ ] Share school-specific insights on Discord: "28 MIT submissions so far — avg SAT 1540"
- [ ] Create TikTok/Reels from the data: "I analyzed 500 Stanford applications..."
- [ ] Target Ivy Day (Mar 26) with pre-made content ready to go
- [ ] Hit UCs hard when decisions drop (April)
- [ ] Push for May 1 National Decision Day content

---

## Admitted Student Communities to Target

After decisions release, admitted students form communities on:
- **GroupMe**: Most popular for admitted class chats (e.g., "UCLA Class of 2030 Admitted Students")
- **Discord**: Discord Student Hubs are increasingly popular. Many schools have official/unofficial servers.
- **Instagram**: Admitted student pages (e.g., @stanford2030)
- **Facebook Groups**: Still used for some schools (declining)

**Strategy**: Don't spam these groups. Join as a community member. Share the tool naturally: "I found this site that shows everyone's stats who applied — pretty interesting to compare."

---

## Social Media Strategy

### TikTok (PRIMARY — highest viral potential)
**Why TikTok:**
- College admissions content is MASSIVE on TikTok (#collegeadmissions has 3B+ views)
- Short-form video + data = highly shareable ("I analyzed 1000 Stanford apps...")
- Decision reaction videos get millions of views
- Young demographic matches target users exactly

**Content Types:**
1. **Data reveals**: "The REAL stats that got people into [school]" — screen record scrolling through accepted.fyi data
2. **Myth busting**: "Everyone thinks you need a 1500+ SAT for Stanford. Here's what the data actually shows."
3. **School comparisons**: "Harvard vs. Stanford: which one is harder to get into? (based on actual data)"
4. **Decision Day reactions**: Partner with students who agree to film their reaction + submit data
5. **Trends/surprises**: "The most surprising school where a 3.5 GPA got accepted"

**Posting cadence**: 1-2 per day during decision season (March-April), 3-4 per week off-season

### Instagram (SECONDARY — shareability)
**Why Instagram:**
- Decision Day cards are perfect for Stories
- Infographics perform well on Reels + Feed
- More polished/curated than TikTok — good for brand building

**Content Types:**
1. **Shareable decision cards** (the core viral mechanic)
2. **Infographic carousels**: "5 things every [school] applicant had in common"
3. **Stories polls**: "Did you get in? Vote accepted/rejected/waitlisted"
4. **Reels**: Same data-reveal format as TikTok

### Reddit (TACTICAL — high-intent users)
- Already covered in growth strategy. This is the highest-intent channel — people are literally posting their stats and asking for data.
- Key subreddits: r/ApplyingToCollege (650K), r/CollegeResults, r/chanceme, r/collegeresults

### TikTok vs Instagram: Start with Both, But...
- **TikTok** is the acquisition channel (reach new users)
- **Instagram** is the retention/sharing channel (decision cards, community)
- If you can only do one: **TikTok first.** The reach is unmatched for this demographic.

---

## How to Make Impressive Content (Without a Budget)

### Tools
- **CapCut** (free): Edit TikToks/Reels with text overlays, transitions, music
- **Canva** (free tier): Design decision cards, infographics, carousels
- **Screen recording**: Record yourself scrolling through accepted.fyi data — authentic > polished
- **Loom or QuickTime**: Record quick walkthroughs of the platform

### Content Formula That Works
1. **Hook (first 2 seconds)**: "You won't believe the GPA that got into Harvard" or "I analyzed 500 college applications"
2. **Data reveal (3-15 seconds)**: Show the actual numbers — scroll through the app, show the stats
3. **CTA (last 3 seconds)**: "Link in bio to see all the data" or "Submit yours at accepted.fyi"

### Production Tips
- Use trending sounds (check TikTok's discover page)
- Post at 7-9am or 6-9pm (when students check phones before/after school)
- Reply to EVERY comment in the first hour (algorithm boost)
- Duet/stitch decision reaction videos from other creators

### Off-Camera / Faceless Content Strategy

**You do NOT need to be on camera.** The most viral college admissions content is screen recordings and text overlays, not talking heads. The most followed data accounts on TikTok (stock market, real estate, salary data) are almost all faceless.

**Best faceless formats for this audience:**

1. **Screen recordings of the platform**: Scroll through accepted.fyi showing real data with text overlay narration. "Let me show you what a 3.8 GPA, 1480 SAT applicant's results looked like at Stanford."
2. **Text-on-screen data reveals**: Green screen a stat, reveal the answer. "What SAT score gets you into MIT?" → show the data. Highest-performing format on admissions TikTok.
3. **Slideshow / carousel style**: Static cards with stats, animated with CapCut transitions. "5 schools where a 1400 SAT is enough" — each slide is a school card.
4. **AI voiceover option**: Tools like ElevenLabs or CapCut's built-in TTS can narrate if you'd prefer not to use your own voice. Many viral data accounts use AI voices exclusively.

**Why an adult/parent voice actually HELPS:**
- Parents are a huge secondary audience on admissions TikTok — they share content with their kids
- An adult sharing real data reads as MORE trustworthy than another 17-year-old doing "chance me" content
- Your content IS the product — the data cards, the reveals, the comparisons. You're the curator, not the personality.

**Recommended progression:**
1. **Week 1-2**: Pure text overlay + screen recordings (no voice, no face)
2. **Week 3-4**: Add voiceover narration if comfortable (still no face)
3. **Optional later**: Show hands pointing at screen, or do over-the-shoulder shots
4. **Never required**: Face on camera

---

## Budget: Lean Launch

| Item | Cost | Notes |
|------|------|-------|
| Domain (accepted.fyi) | ~$15-20/yr | Already planned |
| Infrastructure | $0 | Vercel + Supabase free tiers |
| TikTok/Instagram (organic) | $0 | Content creation from data |
| Boosted posts (optional) | $50-100/mo | Only during Mar-Apr decision season |
| CapCut Pro (optional) | $8/mo | Free tier is usually enough |
| Canva Pro (optional) | $13/mo | Free tier is usually enough |
| **Total launch cost** | **~$15-120** | Essentially free |

---

## Success Metrics for First Decision Season (March-May 2026)

| Metric | Target |
|--------|--------|
| Submissions | 500+ |
| Unique schools with data | 30+ |
| Registered users | 1,000+ |
| At least one school with 50+ submissions | Yes |
| TikTok followers | 1,000+ |
| Organic search impressions | 10,000+ |
| At least 1 Reddit post with 100+ upvotes | Yes |

These are achievable with zero budget if the product is good and the timing is right — and the timing is perfect.

---

## Key Dates to Have Content Ready

| Date | Event | Content to Prepare |
|------|-------|--------------------|
| **Mar 14** | MIT Pi Day decisions | "MIT acceptance data — first look" TikTok |
| **Mid-March** | Caltech, Duke, Georgetown RD | School-specific data posts |
| **Mar 26** | Ivy Day | Pre-made content for ALL 8 Ivies. Biggest day of the year. |
| **Late March** | Stanford RD | Stanford-specific content (highest engagement school) |
| **Early April** | UC decisions | UC-specific content (highest volume) |
| **May 1** | National Decision Day | "Where is everyone going?" recap content |
