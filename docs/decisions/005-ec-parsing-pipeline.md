# 005: Extracurricular Parsing & Intelligence Pipeline

**Date:** 2026-03-09
**Status:** Planned
**Context:** Extracurricular activities are the #1 differentiator between accepted and rejected students with identical stats (same GPA, same SAT). But EC data today is unstructured freeform text — impossible to query, compare, or run ML on. This document defines a 3-phase pipeline to extract, structure, analyze, and explain EC data at scale, creating the single biggest competitive moat for accepted.fyi.

---

## Table of Contents

1. [The Problem](#the-problem)
2. [Current State](#current-state)
3. [Pipeline Architecture Overview](#pipeline-architecture-overview)
4. [Phase 2A: GenAI Extraction](#phase-2a-genai-extraction-build-first)
5. [Phase 2B: ML Pattern Detection](#phase-2b-ml-pattern-detection)
6. [Phase 2C: GenAI Explanation Layer](#phase-2c-genai-explanation-layer)
7. [EC Taxonomy](#ec-taxonomy)
8. [Database Schema](#database-schema)
9. [Implementation Files](#implementation-files)
10. [Rollout Timeline & Triggers](#rollout-timeline--triggers)
11. [Monetization Tiers](#monetization-tiers)
12. [Competitive Moat Analysis](#competitive-moat-analysis)
13. [ML vs Generative AI — When to Use Which](#ml-vs-generative-ai--when-to-use-which)
14. [Risks & Mitigations](#risks--mitigations)
15. [Cost Projections](#cost-projections)

---

## The Problem

Students describe the same activity a hundred different ways:

```
"President of robotics club"
"I led our school's FIRST robotics team"
"Robotics team captain, went to nationals"
"FRC Team 1234 Lead Programmer"
"Built robots competitively for 3 years"
```

These are all the same activity. But a database sees 5 completely different strings.

The current `extracurriculars` field on `admission_submissions` is a `text[]` array of raw strings — useful for display, useless for analysis. You cannot query "show me all students with robotics experience who got into MIT" without manually reading every row.

No existing competitor has structured, individual-level EC data at scale:

| Competitor | Has EC Data? | Structured? | ML Patterns? |
|------------|-------------|-------------|--------------|
| CollegeVine | Self-reported checkboxes (shallow) | Somewhat | Basic |
| Naviance | No — only GPA/SAT scattergrams | N/A | No |
| Scoir | No EC data | N/A | No |
| College Scorecard | No — institutional only | N/A | No |
| Empowerly | Anecdotal from consultants | No | No |
| **accepted.fyi** | **Rich freeform text from Reddit + user submissions** | **Not yet — this doc fixes that** | **Not yet — Phase 2B** |

---

## Current State

### What Exists Today

**Reddit ingestion pipeline** (`scripts/ingest-reddit.ts`) already parses ECs:

```typescript
// Current: parseExtracurriculars() at line 489
// Extracts raw activity names from the **Extracurriculars** section
// Splits on newlines, strips bullets/numbers, takes the name before ":"
// Stores as text[] array on admission_submissions.extracurriculars
// Max 10 ECs per submission, max 100 chars each
```

**Example current output** (stored in DB):
```
["Varsity Soccer", "Coding Nonprofit", "USAMO", "Family Restaurant", "Research Paper"]
```

**What's missing:**
- No categorization (is "Varsity Soccer" athletics or leadership?)
- No level/recognition tagging (school-level vs national-level)
- No leadership role extraction (participant vs captain vs founder)
- No duration/impact metrics (4 years, 200 students served)
- No cross-submission querying ("find all students with research experience")
- No pattern analysis ("what ECs correlate with MIT acceptance?")

### Existing Schema Fields

```
admission_submissions.extracurriculars  →  text[]  (raw strings, unstructured)
admission_submissions.applicantHighlight →  text    (freeform, often contains EC context)
```

No dedicated `activities` table exists. No EC taxonomy or categorization.

---

## Pipeline Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EC PARSING & INTELLIGENCE PIPELINE                       │
│                                                                             │
│  ┌───────────────────┐                                                      │
│  │   DATA SOURCES     │                                                      │
│  │                     │                                                      │
│  │  Reddit posts       │─── raw text ──┐                                     │
│  │  User submissions   │─── raw text ──┤                                     │
│  │  College Conf.      │─── raw text ──┤                                     │
│  └───────────────────┘               │                                     │
│                                       ▼                                     │
│  ┌─────────────────────────────────────────────┐                            │
│  │           PHASE 2A: GenAI EXTRACTION         │                            │
│  │              (Claude API)                     │                            │
│  │                                               │                            │
│  │  Input:  "Varsity soccer 4 yrs (captain sr    │                            │
│  │           yr), started a nonprofit teaching   │                            │
│  │           coding to underprivileged kids"     │                            │
│  │                                               │                            │
│  │  Output: [                                    │                            │
│  │    { activity: "Soccer",                      │                            │
│  │      category: "athletics",                   │                            │
│  │      level: "varsity",                        │                            │
│  │      leadership: "captain",                   │                            │
│  │      years: 4,                                │                            │
│  │      recognition: "school" },                 │                            │
│  │    { activity: "Coding nonprofit",            │                            │
│  │      category: "community_service",           │                            │
│  │      level: "founder",                        │                            │
│  │      leadership: "founder",                   │                            │
│  │      impact_number: 200,                      │                            │
│  │      recognition: "community" }               │                            │
│  │  ]                                            │                            │
│  │                                               │                            │
│  │  Cost: ~$0.01/profile                         │                            │
│  │  Trigger: Build now                           │                            │
│  └──────────────────┬──────────────────────────┘                            │
│                      │                                                       │
│                      ▼                                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │         STRUCTURED DATABASE                   │                            │
│  │           (activities table)                   │                            │
│  │                                               │                            │
│  │  ┌─────────┬───────────┬────────┬──────────┐ │                            │
│  │  │ activity│ category  │ level  │leadership│ │                            │
│  │  ├─────────┼───────────┼────────┼──────────┤ │                            │
│  │  │ Soccer  │ athletics │ varsity│ captain  │ │                            │
│  │  │ Coding  │ community │ founder│ founder  │ │                            │
│  │  │ USAMO   │ acad_comp │national│ null     │ │                            │
│  │  │ ...     │ ...       │ ...    │ ...      │ │                            │
│  │  └─────────┴───────────┴────────┴──────────┘ │                            │
│  │                                               │                            │
│  │  Queryable, filterable, aggregatable          │                            │
│  └──────────────────┬──────────────────────────┘                            │
│                      │                                                       │
│                      ▼                                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │        PHASE 2B: ML PATTERN DETECTION         │                            │
│  │         (scikit-learn / XGBoost)              │                            │
│  │                                               │                            │
│  │  Model 1: Feature Importance (Random Forest)  │                            │
│  │  ┌──────────────────────────────────────────┐│                            │
│  │  │ MIT Acceptance Boosters:                  ││                            │
│  │  │   has_academic_competition  → +18%        ││                            │
│  │  │   has_research              → +14%        ││                            │
│  │  │   highest_recognition       → +11%/level  ││                            │
│  │  │   founder_or_creator        → +9%         ││                            │
│  │  └──────────────────────────────────────────┘│                            │
│  │                                               │                            │
│  │  Model 2: Student Clustering (K-Means)        │                            │
│  │  ┌──────────────────────────────────────────┐│                            │
│  │  │ Cluster A: "STEM Researcher"     → 34%   ││                            │
│  │  │ Cluster B: "Well-Rounded Leader" → 18%   ││                            │
│  │  │ Cluster C: "Social Entrepreneur" → 28%   ││                            │
│  │  │ Cluster D: "Creative Specialist" → 22%   ││                            │
│  │  │ Cluster E: "Working Student"     → 15%   ││                            │
│  │  └──────────────────────────────────────────┘│                            │
│  │                                               │                            │
│  │  Model 3: Acceptance Predictor (Logistic Reg) │                            │
│  │  ┌──────────────────────────────────────────┐│                            │
│  │  │ GPA + SAT + demographics + EC features   ││                            │
│  │  │ → P(acceptance) per school               ││                            │
│  │  │ → Quantifies EC contribution to chances  ││                            │
│  │  └──────────────────────────────────────────┘│                            │
│  │                                               │                            │
│  │  Cost: ~$0 (CPU, runs on your server)         │                            │
│  │  Trigger: 25,000+ parsed ECs                  │                            │
│  └──────────────────┬──────────────────────────┘                            │
│                      │                                                       │
│                      ▼                                                       │
│  ┌─────────────────────────────────────────────┐                            │
│  │      PHASE 2C: GenAI EXPLANATION LAYER        │                            │
│  │            (Claude API)                        │                            │
│  │                                               │                            │
│  │  Input:  ML output + student profile +         │                            │
│  │          similar student outcomes from DB      │                            │
│  │                                               │                            │
│  │  Output: "Your EC profile matches the 'STEM   │                            │
│  │  Researcher' archetype. Students with this     │                            │
│  │  profile have a 34% acceptance rate at MIT.    │                            │
│  │  The 3 most similar accepted students all      │                            │
│  │  had research publications. Adding a summer    │                            │
│  │  research program would have the single        │                            │
│  │  biggest impact on your chances."              │                            │
│  │                                               │                            │
│  │  Cost: ~$0.01/query                            │                            │
│  │  Trigger: 50,000+ parsed ECs                  │                            │
│  └─────────────────────────────────────────────┘                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Simplified Data Flow

```
  Raw Text          GenAI             Structured DB        ML              GenAI
  ─────────  ──►  ───────────  ──►  ─────────────  ──►  ──────────  ──►  ──────────
  "President       Parse &           { category:          Patterns,        "Here's why
   of robotics     categorize         "stem_clubs",       clusters,        MIT admits
   club, went      with Claude        level: "school",    feature          have research
   to nationals"                      leadership:         importance       at 3x the
                                      "president",        per school       rate of your
                                      recognition:                         profile..."
                                      "national" }
```

---

## Phase 2A: GenAI Extraction (Build First)

### Trigger
Build immediately. Run against existing Reddit data (~3,100 outcomes) + all new user submissions.

### What It Does
Takes raw EC text (from Reddit posts, user submission forms, or other scraped sources) and outputs structured, categorized, tagged JSON.

### GenAI Prompt Strategy

System prompt defining the taxonomy + few-shot examples. Request structured JSON output. Validate against taxonomy enums server-side. Flag low-confidence parses for manual review.

**Example prompt:**

```
You are an extracurricular activity parser for college admissions data.

Given a list of extracurricular activities (raw text from a student's
college application profile), extract EACH activity into structured JSON.

Use ONLY these categories: athletics, academic_competition, research,
community_service, arts, leadership, work_experience, stem_clubs,
publications, other

Use ONLY these recognition levels: international, national, state,
regional, school, community, personal

Return JSON array. If uncertain about a field, set it to null.
Do not invent information not present in the text.
```

### Input → Output Examples

**Example 1: Rich freeform text**

Input:
```
Varsity soccer 4 yrs (captain sr yr), started a nonprofit teaching
coding to underprivileged kids (~200 students served), USAMO qualifier,
worked at my dad's restaurant on weekends, published a paper on graph
theory in a minor journal
```

Output:
```json
[
  {
    "activity": "Soccer",
    "category": "athletics",
    "subcategory": "team_sport",
    "level": "varsity",
    "leadership_role": "captain",
    "years": 4,
    "impact_number": null,
    "impact_description": null,
    "recognition_level": "school"
  },
  {
    "activity": "Coding education nonprofit",
    "category": "community_service",
    "subcategory": "founder_led",
    "level": "founder",
    "leadership_role": "founder",
    "years": null,
    "impact_number": 200,
    "impact_description": "students taught",
    "recognition_level": "community"
  },
  {
    "activity": "USAMO",
    "category": "academic_competition",
    "subcategory": "math",
    "level": "qualifier",
    "leadership_role": null,
    "years": null,
    "impact_number": null,
    "impact_description": null,
    "recognition_level": "national"
  },
  {
    "activity": "Family restaurant",
    "category": "work_experience",
    "subcategory": "family_business",
    "level": "part_time",
    "leadership_role": null,
    "years": null,
    "impact_number": null,
    "impact_description": null,
    "recognition_level": null
  },
  {
    "activity": "Graph theory research paper",
    "category": "research",
    "subcategory": "math",
    "level": "published",
    "leadership_role": "first_author",
    "years": null,
    "impact_number": null,
    "impact_description": null,
    "recognition_level": "regional"
  }
]
```

**Example 2: Sparse bullet list (common in Reddit posts)**

Input:
```
- NHS
- Key Club treasurer
- Track & Field
- Tutored at library
```

Output:
```json
[
  {
    "activity": "National Honor Society",
    "category": "leadership",
    "subcategory": "honor_society",
    "level": "member",
    "leadership_role": null,
    "years": null,
    "impact_number": null,
    "impact_description": null,
    "recognition_level": "school"
  },
  {
    "activity": "Key Club",
    "category": "community_service",
    "subcategory": "service_club",
    "level": "member",
    "leadership_role": "treasurer",
    "years": null,
    "impact_number": null,
    "impact_description": null,
    "recognition_level": "school"
  },
  {
    "activity": "Track and Field",
    "category": "athletics",
    "subcategory": "individual_sport",
    "level": null,
    "leadership_role": null,
    "years": null,
    "impact_number": null,
    "impact_description": null,
    "recognition_level": "school"
  },
  {
    "activity": "Library tutoring",
    "category": "community_service",
    "subcategory": "tutoring",
    "level": "volunteer",
    "leadership_role": null,
    "years": null,
    "impact_number": null,
    "impact_description": null,
    "recognition_level": "community"
  }
]
```

### Why GenAI (Not Regex/Rules) for This Step

| Approach | Handles "USAMO" → "math competition, national"? | Handles "FRC 1234" → "FIRST Robotics"? | Handles "started a nonprofit" → "founder"? |
|----------|-------|-------|-------|
| Regex/keyword rules | Maybe, with a large lookup table | Only with exhaustive mapping | No — requires language understanding |
| GenAI (Claude) | Yes — knows what USAMO is | Yes — knows FIRST Robotics | Yes — understands "started" = founder |

Freeform text requires language understanding. GenAI is the right tool for extraction. ML is the wrong tool here — ML needs structured input, which is exactly what we don't have yet.

### Backfill Strategy

Run against all existing submissions that have non-empty `extracurriculars` arrays:

```
┌──────────────────────────────────────────────────────┐
│  BACKFILL: Existing Reddit Data                       │
│                                                        │
│  1. Query all admission_submissions WHERE              │
│     extracurriculars != '{}' AND data_source = 'reddit'│
│                                                        │
│  2. For each submission:                               │
│     a. Concatenate extracurriculars[] into raw text    │
│     b. Include applicant_highlight if present          │
│     c. Send to Claude API for structured extraction    │
│     d. Validate output against taxonomy enums          │
│     e. INSERT rows into activities table               │
│                                                        │
│  3. Rate limit: 10 requests/second to Claude API       │
│  4. Batch size: 100 submissions per run                │
│  5. Resume capability: skip submissions that already   │
│     have rows in activities table                      │
│                                                        │
│  Estimated: ~3,100 submissions × $0.01 = ~$31          │
└──────────────────────────────────────────────────────┘
```

### Integration with User Submission Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  NEW SUBMISSION FLOW (after Phase 2A)                                │
│                                                                       │
│  User fills out form                                                  │
│       │                                                               │
│       ▼                                                               │
│  POST /api/submissions                                                │
│       │                                                               │
│       ├──► INSERT into admission_submissions (existing)               │
│       │    (extracurriculars stored as text[] for backward compat)    │
│       │                                                               │
│       └──► ASYNC: Send extracurriculars text to Claude API            │
│                │                                                      │
│                ▼                                                      │
│            Parse response, validate against taxonomy                  │
│                │                                                      │
│                ▼                                                      │
│            INSERT structured rows into activities table               │
│                │                                                      │
│                ▼                                                      │
│            If parse_confidence < 0.7 → flag for manual review         │
│                                                                       │
│  Note: EC parsing is async — submission succeeds even if parsing      │
│  fails. Parsed data appears on the submission within ~2-5 seconds.    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 2B: ML Pattern Detection

### Trigger
Build when the `activities` table reaches 25,000+ parsed records (~10,000 submissions with an average of 2.5 ECs each).

### What It Does
Finds statistically significant patterns between EC profiles and admissions outcomes that humans cannot easily see.

### Model 1: Feature Importance (Random Forest / XGBoost)

**What it answers:** "Which EC categories matter most for acceptance at each school?"

**Input features (per student):**

```
┌──────────────────────────────────────────────────────────────────┐
│  FEATURE VECTOR (one row per submission)                          │
│                                                                    │
│  Boolean flags:                                                    │
│    has_athletics              : 0 or 1                             │
│    has_research               : 0 or 1                             │
│    has_academic_competition   : 0 or 1                             │
│    has_community_service      : 0 or 1                             │
│    has_arts                   : 0 or 1                             │
│    has_leadership             : 0 or 1                             │
│    has_work_experience        : 0 or 1                             │
│    has_stem_clubs             : 0 or 1                             │
│    has_publications           : 0 or 1                             │
│    founder_or_creator         : 0 or 1                             │
│                                                                    │
│  Numeric features:                                                 │
│    highest_recognition_level  : 1-7 (personal → international)     │
│    ec_depth_score             : float (years × leadership weight)  │
│    ec_breadth_score           : int (# distinct categories)        │
│    total_ecs                  : int                                 │
│                                                                    │
│  Context features (non-EC, for comparison):                        │
│    gpa_unweighted             : float                              │
│    sat_score                  : int                                 │
│    first_generation           : 0 or 1                             │
│    state_of_residence         : encoded                            │
│    high_school_type           : encoded                            │
│    application_round          : encoded                            │
│                                                                    │
│  Target variable:                                                  │
│    accepted                   : 0 or 1                             │
└──────────────────────────────────────────────────────────────────┘
```

**Output: Per-school feature importance rankings**

```
┌──────────────────────────────────────────────────────────────────┐
│  FEATURE IMPORTANCE: MIT                                          │
│                                                                    │
│  Feature                         Importance    Acceptance Boost    │
│  ────────────────────────────    ──────────    ────────────────    │
│  1. has_academic_competition       0.23            +18%            │
│  2. has_research                   0.19            +14%            │
│  3. highest_recognition_level      0.15            +11% per level  │
│  4. founder_or_creator             0.12            +9%             │
│  5. has_stem_clubs                 0.08            +5%             │
│  6. ec_depth_score                 0.07            +4%             │
│  7. has_publications               0.06            +3%             │
│  8. has_athletics                  0.03            +1%             │
│  9. ec_breadth_score               0.02            -2%  ← !       │
│  10. has_community_service         0.01            +0.5%           │
│                                                                    │
│  Key insight: Breadth HURTS at MIT. Depth + recognition matter.   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  FEATURE IMPORTANCE: UVA                                          │
│                                                                    │
│  Feature                         Importance    Acceptance Boost    │
│  ────────────────────────────    ──────────    ────────────────    │
│  1. has_leadership                 0.21            +12%            │
│  2. has_community_service          0.18            +10%            │
│  3. ec_breadth_score               0.14            +8%             │
│  4. has_athletics                  0.11            +6%             │
│  5. ec_depth_score                 0.09            +5%             │
│  ...                                                               │
│                                                                    │
│  Key insight: UVA values well-rounded profiles. Breadth helps.    │
└──────────────────────────────────────────────────────────────────┘
```

### Model 2: Student Clustering (K-Means)

**What it answers:** "What EC archetypes exist, and how do they perform at each school?"

```
┌──────────────────────────────────────────────────────────────────┐
│  EC ARCHETYPES (discovered by K-Means clustering)                 │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Cluster A: "The STEM Researcher"                             │ │
│  │  Typical ECs: Research + academic competitions + STEM clubs   │ │
│  │  Recognition: Usually national or state level                 │ │
│  │  Profile: Deep, narrow, technical                             │ │
│  │                                                               │ │
│  │  Acceptance rates:                                            │ │
│  │    MIT: 34%  │  Stanford: 12%  │  Georgia Tech: 52%          │ │
│  │    Caltech: 28%  │  CMU: 41%  │  Average: 31%               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Cluster B: "The Well-Rounded Leader"                         │ │
│  │  Typical ECs: Varsity sport + student gov + community service │ │
│  │  Recognition: Usually school level, some state               │ │
│  │  Profile: Broad, balanced, traditional                        │ │
│  │                                                               │ │
│  │  Acceptance rates:                                            │ │
│  │    UVA: 38%  │  Michigan: 42%  │  UNC: 35%                  │ │
│  │    MIT: 8%  │  Stanford: 5%  │  Average: 18%                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Cluster C: "The Social Entrepreneur"                         │ │
│  │  Typical ECs: Founded nonprofit/org + community impact +     │ │
│  │               public speaking/debate                          │ │
│  │  Recognition: Community to national                           │ │
│  │  Profile: Impact-driven, initiative, social good              │ │
│  │                                                               │ │
│  │  Acceptance rates:                                            │ │
│  │    Stanford: 18%  │  Harvard: 15%  │  Yale: 20%             │ │
│  │    Penn: 22%  │  Duke: 19%  │  Average: 28%                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Cluster D: "The Creative Specialist"                         │ │
│  │  Typical ECs: Visual arts / music / theater / writing +      │ │
│  │               portfolio or performances                       │ │
│  │  Recognition: Regional to national                            │ │
│  │  Profile: Deep artistic commitment, portfolio-driven          │ │
│  │                                                               │ │
│  │  Acceptance rates:                                            │ │
│  │    RISD: 42%  │  NYU: 35%  │  Northwestern: 25%             │ │
│  │    MIT: 4%  │  Georgia Tech: 10%  │  Average: 22%           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Cluster E: "The Working Student"                             │ │
│  │  Typical ECs: Part-time job + family responsibilities +      │ │
│  │               fewer traditional ECs                           │ │
│  │  Recognition: Community or personal                           │ │
│  │  Profile: Demonstrates grit, socioeconomic context           │ │
│  │                                                               │ │
│  │  Acceptance rates:                                            │ │
│  │    Schools valuing SES context: 31%                           │ │
│  │    Highly selective overall: 15%                               │ │
│  │    Average: 19%                                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  NOTE: Acceptance rates are illustrative. Actual values will       │
│  be computed from real data once 25K+ ECs are parsed.             │
└──────────────────────────────────────────────────────────────────┘
```

### Model 3: Acceptance Predictor (Logistic Regression)

**What it answers:** "How much do ECs actually improve your chances vs stats alone?"

```
┌──────────────────────────────────────────────────────────────────┐
│  MODEL COMPARISON: Stats-Only vs Stats + ECs                      │
│                                                                    │
│  Model A (baseline): GPA + SAT + demographics → P(accepted)       │
│  Model B (enhanced): GPA + SAT + demographics + EC features       │
│                       → P(accepted)                                │
│                                                                    │
│  Per-school accuracy improvement:                                  │
│                                                                    │
│  School          Model A (AUC)    Model B (AUC)    Improvement    │
│  ──────────────  ─────────────    ─────────────    ───────────    │
│  MIT              0.72             0.84             +16.7%         │
│  Stanford         0.68             0.81             +19.1%         │
│  UVA              0.80             0.85             +6.3%          │
│  Georgia Tech     0.83             0.88             +6.0%          │
│  UCLA             0.79             0.82             +3.8%          │
│                                                                    │
│  Insight: ECs matter MORE at holistic-review schools (MIT,         │
│  Stanford) and LESS at formula-driven schools (UCLA, GT).          │
│  This matches what CDS factor ratings show but now we can          │
│  QUANTIFY the effect.                                              │
│                                                                    │
│  NOTE: AUC values are illustrative targets. Actual values          │
│  depend on data volume and quality.                                │
└──────────────────────────────────────────────────────────────────┘
```

### Infrastructure

```
┌──────────────────────────────────────────────────────────────────┐
│  ML INFRASTRUCTURE (Phase 2B)                                     │
│                                                                    │
│  Training:                                                         │
│    - Python script (scikit-learn / XGBoost)                        │
│    - Runs locally or in a GitHub Action on schedule                │
│    - Input: CSV export from activities + submissions tables        │
│    - Output: model weights (pickle/ONNX) + feature importance JSON│
│    - Frequency: Retrain monthly as new data arrives                │
│    - Training time: seconds on CPU (tabular data, not deep learn) │
│    - NO GPU required                                               │
│                                                                    │
│  Serving:                                                          │
│    - Option A: Export feature importance as static JSON,            │
│                serve from CDN (simplest, cheapest)                 │
│    - Option B: ONNX model in Vercel serverless function            │
│                (for real-time prediction on user input)            │
│    - Option C: Lightweight Python API (Flask/FastAPI) on           │
│                Railway/Render free tier                             │
│                                                                    │
│  Recommendation: Start with Option A (static JSON). Move to       │
│  Option B when real-time prediction is needed for the chances      │
│  calculator enhancement.                                           │
│                                                                    │
│  Cost: Effectively $0. Training and inference are trivial for      │
│  tabular ML models.                                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase 2C: GenAI Explanation Layer

### Trigger
Build when Phase 2B models are producing reliable patterns (~50,000+ parsed ECs, ~20,000 submissions).

### What It Does
Translates ML outputs (numbers, percentages, cluster labels) into personalized, actionable advice that a parent or student can understand and act on.

### Example End-to-End Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  USER INPUT                                                       │
│                                                                    │
│  GPA: 3.85  |  SAT: 1490  |  State: TX  |  Major: CS            │
│  ECs: Varsity tennis, Math club, 100hrs volunteering              │
│                                                                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1: GenAI PARSES ECs (Phase 2A)                              │
│                                                                    │
│  [                                                                 │
│    { activity: "Tennis", category: "athletics",                    │
│      level: "varsity", recognition: "school" },                   │
│    { activity: "Math Club", category: "stem_clubs",               │
│      level: "member", recognition: "school" },                    │
│    { activity: "Volunteering", category: "community_service",     │
│      level: "volunteer", recognition: "community" }               │
│  ]                                                                 │
│                                                                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2: ML MODELS RUN (Phase 2B)                                 │
│                                                                    │
│  Feature vector: has_athletics=1, has_stem=1,                     │
│    has_community_service=1, has_research=0,                       │
│    has_academic_competition=0, highest_recognition=school,         │
│    ec_depth=low, ec_breadth=3, founder=0                          │
│                                                                    │
│  Results:                                                          │
│    Cluster: "Well-Rounded Leader" (Cluster B)                     │
│    Georgia Tech chance: 34% (EC boost: -3%)                       │
│    MIT chance: 8% (EC boost: -12%)                                │
│    UT Austin chance: 89% (EC boost: +2%)                          │
│    Top missing factor: has_research (+14% at GT, +18% at MIT)     │
│                                                                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3: GenAI EXPLAINS (Phase 2C)                                │
│                                                                    │
│  Prompt to Claude:                                                 │
│    "Given this student profile, ML results, and the 15 most       │
│     similar students from our database, generate a personalized   │
│     EC analysis in 3-4 paragraphs."                               │
│                                                                    │
│  Output shown to user:                                             │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  Your EC Profile: "Well-Rounded Leader"                      │   │
│  │                                                              │   │
│  │  Your extracurricular profile — varsity athletics, club      │   │
│  │  involvement, and community service — is what we call a      │   │
│  │  "Well-Rounded Leader." This profile works well at schools   │   │
│  │  like UVA (38% acceptance for similar profiles) and          │   │
│  │  Michigan (42%) that value balanced students.                │   │
│  │                                                              │   │
│  │  For Georgia Tech, your chances are moderate (34%). Your     │   │
│  │  GPA (3.85) is strong, but accepted CS majors at GT who      │   │
│  │  had research experience or competition awards were          │   │
│  │  admitted at 52% — nearly 1.5x your rate. Your math club    │   │
│  │  membership helps but doesn't carry the same weight as       │   │
│  │  a competition placement (AMC/AIME/USAMO).                  │   │
│  │                                                              │   │
│  │  For MIT, your chances are low (8%) primarily because MIT    │   │
│  │  accepted students overwhelmingly have: research (65% of    │   │
│  │  admits), competition awards in STEM (72%), or founded       │   │
│  │  something technical (41%). Students with your GPA/SAT but  │   │
│  │  with a research publication had a 22% acceptance rate —     │   │
│  │  nearly 3x higher.                                          │   │
│  │                                                              │   │
│  │  Recommended action: If you're a junior with time, adding   │   │
│  │  a summer research program (even a 6-week REU or online     │   │
│  │  research project) would have the single biggest impact     │   │
│  │  on your chances at STEM-focused schools.                   │   │
│  │                                                              │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## EC Taxonomy

### Activity Categories

```
┌──────────────────────┬────────────────────────────────────────────────────┐
│  Category             │  Subcategories                                     │
├──────────────────────┼────────────────────────────────────────────────────┤
│  athletics            │  team_sport, individual_sport, club_sport,         │
│                        │  recreational, martial_arts                        │
├──────────────────────┼────────────────────────────────────────────────────┤
│  academic_competition │  math (AMC/AIME/USAMO), science (Science Olympiad,│
│                        │  ISEF), debate/speech, writing, business (DECA,   │
│                        │  FBLA), engineering, quiz_bowl, model_un          │
├──────────────────────┼────────────────────────────────────────────────────┤
│  research             │  stem, humanities, social_science, clinical,       │
│                        │  published, unpublished, poster_presentation      │
├──────────────────────┼────────────────────────────────────────────────────┤
│  community_service    │  volunteer, founder_led, religious, political,     │
│                        │  tutoring, mentoring, fundraising, service_club   │
│                        │  (Key Club, Interact, Leo Club)                   │
├──────────────────────┼────────────────────────────────────────────────────┤
│  arts                 │  visual, music_performance, music_composition,     │
│                        │  theater, dance, film, creative_writing,          │
│                        │  photography                                       │
├──────────────────────┼────────────────────────────────────────────────────┤
│  leadership           │  student_government, club_president, team_captain, │
│                        │  peer_mentor, honor_society (NHS), class_officer   │
├──────────────────────┼────────────────────────────────────────────────────┤
│  work_experience      │  internship, part_time, family_business,           │
│                        │  entrepreneurship, freelance, summer_job           │
├──────────────────────┼────────────────────────────────────────────────────┤
│  stem_clubs           │  robotics (FRC/FTC/VEX), coding, science_olympiad,│
│                        │  engineering, math_club, cs_club, cyber_security  │
├──────────────────────┼────────────────────────────────────────────────────┤
│  publications         │  journal_paper, school_newspaper, blog, book,      │
│                        │  literary_magazine, podcast                        │
├──────────────────────┼────────────────────────────────────────────────────┤
│  other                │  hobby, travel, personal_project,                  │
│                        │  family_responsibility, religious_org, scouting    │
└──────────────────────┴────────────────────────────────────────────────────┘
```

### Recognition Levels (Ordered)

```
┌──────┬───────────────┬──────────────────────────────────────────────────┐
│ Rank │ Level          │ Examples                                          │
├──────┼───────────────┼──────────────────────────────────────────────────┤
│  7   │ international  │ IMO, Intel ISEF winner, international journal,   │
│      │                │ Olympics-level athlete                             │
├──────┼───────────────┼──────────────────────────────────────────────────┤
│  6   │ national       │ USAMO qualifier, national debate finalist,        │
│      │                │ Eagle Scout, All-American, national publication   │
├──────┼───────────────┼──────────────────────────────────────────────────┤
│  5   │ state          │ All-State athlete, state science fair winner,     │
│      │                │ state debate champion, Governor's School          │
├──────┼───────────────┼──────────────────────────────────────────────────┤
│  4   │ regional       │ Regional competition placer, multi-school org,    │
│      │                │ regional orchestra, county-level recognition      │
├──────┼───────────────┼──────────────────────────────────────────────────┤
│  3   │ school         │ Club president, varsity captain, school newspaper │
│      │                │ editor, class officer, school-level awards        │
├──────┼───────────────┼──────────────────────────────────────────────────┤
│  2   │ community      │ Local nonprofit, community volunteer, church      │
│      │                │ group leader, community theater, local mentoring  │
├──────┼───────────────┼──────────────────────────────────────────────────┤
│  1   │ personal       │ Self-taught skill, personal blog/project, hobby,  │
│      │                │ family responsibilities, caregiving               │
└──────┴───────────────┴──────────────────────────────────────────────────┘
```

### Leadership Roles (Standardized)

```
┌──────────────────┬───────────────────────────────────────────┐
│ Role              │ Maps From (raw text examples)              │
├──────────────────┼───────────────────────────────────────────┤
│ founder           │ "started", "founded", "created", "built"  │
│ president         │ "president", "chair", "head of"           │
│ vice_president    │ "VP", "vice president", "co-president"    │
│ captain           │ "captain", "team lead", "team leader"     │
│ treasurer         │ "treasurer", "finance officer"            │
│ secretary         │ "secretary", "communications"             │
│ editor            │ "editor", "editor-in-chief", "managing"  │
│ officer           │ "officer", "board member", "exec"         │
│ section_leader    │ "section leader", "first chair", "concertmaster" │
│ mentor            │ "mentor", "tutor", "teaching assistant"   │
│ member            │ "member", "participant", no role mentioned│
│ null              │ Cannot determine from text                │
└──────────────────┴───────────────────────────────────────────┘
```

---

## Database Schema

### New Table: `activities`

```sql
-- ─────────────────────────────────────────────────────────────────
-- activities: Structured, GenAI-parsed extracurricular activities
-- One row per activity per submission
-- Populated by Phase 2A GenAI extraction pipeline
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE activities (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to the parent submission
  submission_id     UUID NOT NULL REFERENCES admission_submissions(id)
                    ON DELETE CASCADE,

  -- Original text (preserved for re-parsing if taxonomy evolves)
  raw_text          TEXT NOT NULL,

  -- GenAI-extracted structured fields
  activity_name     TEXT NOT NULL,          -- Normalized activity name
  category          TEXT NOT NULL,          -- From EC taxonomy (e.g., "athletics")
  subcategory       TEXT,                   -- More specific (e.g., "team_sport")
  level             TEXT,                   -- Participation level (e.g., "varsity", "founder")
  leadership_role   TEXT,                   -- Standardized role (e.g., "captain", "president")
  years             INTEGER,               -- Duration of involvement
  impact_number     INTEGER,               -- Quantified impact (e.g., 200 students served)
  impact_description TEXT,                  -- What the number means (e.g., "students taught")
  recognition_level TEXT,                   -- From recognition taxonomy (e.g., "national")

  -- Parsing metadata
  parsed_by         TEXT NOT NULL DEFAULT 'claude',  -- 'claude' | 'gpt4' | 'manual'
  parse_confidence  REAL,                            -- 0.0 - 1.0
  taxonomy_version  INTEGER NOT NULL DEFAULT 1,      -- For re-parsing when taxonomy changes

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────

-- Core query patterns
CREATE INDEX idx_activities_submission    ON activities(submission_id);
CREATE INDEX idx_activities_category      ON activities(category);
CREATE INDEX idx_activities_recognition   ON activities(recognition_level);
CREATE INDEX idx_activities_leadership    ON activities(leadership_role);

-- Composite indexes for common filter patterns
-- "Find all students with research at national level"
CREATE INDEX idx_activities_cat_recog     ON activities(category, recognition_level);
-- "Find all students who founded something"
CREATE INDEX idx_activities_cat_leader    ON activities(category, leadership_role);
```

### Drizzle ORM Schema Addition

```typescript
// Add to src/lib/db/schema.ts

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => admissionSubmissions.id, { onDelete: "cascade" }),
    rawText: text("raw_text").notNull(),
    activityName: text("activity_name").notNull(),
    category: text("category").notNull(),
    subcategory: text("subcategory"),
    level: text("level"),
    leadershipRole: text("leadership_role"),
    years: integer("years"),
    impactNumber: integer("impact_number"),
    impactDescription: text("impact_description"),
    recognitionLevel: text("recognition_level"),
    parsedBy: text("parsed_by").notNull().default("claude"),
    parseConfidence: numeric("parse_confidence", { precision: 3, scale: 2 }),
    taxonomyVersion: integer("taxonomy_version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_activities_submission").on(table.submissionId),
    index("idx_activities_category").on(table.category),
    index("idx_activities_recognition").on(table.recognitionLevel),
    index("idx_activities_leadership").on(table.leadershipRole),
    index("idx_activities_cat_recog").on(table.category, table.recognitionLevel),
    index("idx_activities_cat_leader").on(table.category, table.leadershipRole),
  ]
);
```

---

## Implementation Files

```
┌──────────────────────────────────────────────────────────────────┐
│  NEW FILES TO CREATE                                              │
│                                                                    │
│  Phase 2A:                                                         │
│  ├── src/lib/ai/parse-extracurriculars.ts                         │
│  │     Claude API call with structured prompt + taxonomy           │
│  │     Input: raw EC text → Output: structured ActivityParsed[]   │
│  │                                                                 │
│  ├── src/lib/ai/ec-taxonomy.ts                                    │
│  │     Category, subcategory, recognition, leadership enums        │
│  │     Validation functions for GenAI output                       │
│  │                                                                 │
│  ├── scripts/backfill-ec-parsing.ts                               │
│  │     Batch process existing Reddit submissions                   │
│  │     Resume capability, rate limiting, error handling             │
│  │                                                                 │
│  ├── src/lib/db/queries/activities.ts                             │
│  │     getActivitiesForSubmission()                                │
│  │     getActivityDistributionForSchool()                          │
│  │     getSubmissionsByActivityCategory()                          │
│  │                                                                 │
│  Phase 2B:                                                         │
│  ├── ml/                                                           │
│  │   ├── export-training-data.ts                                  │
│  │   │     Export activities + submissions as CSV for Python       │
│  │   ├── train-feature-importance.py                              │
│  │   │     Random Forest / XGBoost per school                      │
│  │   ├── train-clustering.py                                      │
│  │   │     K-Means EC archetype discovery                          │
│  │   ├── train-predictor.py                                       │
│  │   │     Logistic regression: stats + ECs → acceptance          │
│  │   ├── output/                                                   │
│  │   │   ├── feature-importance.json                              │
│  │   │   ├── clusters.json                                         │
│  │   │   └── predictor.onnx                                       │
│  │   └── README.md                                                │
│  │                                                                 │
│  Phase 2C:                                                         │
│  ├── src/lib/ai/explain-ec-profile.ts                             │
│  │     Takes ML output + similar students → GenAI explanation      │
│  │                                                                 │
│  └── src/app/api/ec-analysis/route.ts                             │
│        API endpoint: user profile → full EC intelligence response  │
│                                                                    │
│  MODIFIED FILES                                                    │
│  ├── src/lib/db/schema.ts                                         │
│  │     Add activities table definition                             │
│  ├── scripts/ingest-reddit.ts                                     │
│  │     Add EC parsing step after post parsing                      │
│  └── src/app/api/submissions/route.ts                             │
│        Add async EC parsing on new submissions                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## ML vs Generative AI — When to Use Which

This pipeline uses BOTH tools at different stages. They solve fundamentally different problems:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│  GENERATIVE AI (Claude, GPT)                                       │
│  ════════════════════════════                                       │
│                                                                    │
│  What it does:     Understands language, generates language         │
│  Input:            Unstructured text                                │
│  Output:           Structured data OR natural language              │
│                                                                    │
│  Used for:                                                          │
│    Phase 2A  →  Parse raw EC text into structured JSON             │
│    Phase 2C  →  Explain ML patterns in plain English               │
│                                                                    │
│  Strengths:                                                         │
│    - Understands "FRC 1234" = FIRST Robotics                       │
│    - Understands "started a nonprofit" = founder role              │
│    - Can generate personalized advice paragraphs                   │
│    - Handles edge cases, abbreviations, slang                      │
│                                                                    │
│  Weaknesses:                                                        │
│    - Expensive (~$0.01/call)                                        │
│    - Can hallucinate (invent details not in text)                  │
│    - Slow (~1-3 seconds per call)                                  │
│    - Cannot find statistical patterns across 50,000 profiles       │
│                                                                    │
│  Question it answers:                                               │
│    "What does this text MEAN?"                                     │
│    "How do I EXPLAIN this to a parent?"                            │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│  MACHINE LEARNING (scikit-learn, XGBoost)                          │
│  ════════════════════════════════════════                           │
│                                                                    │
│  What it does:     Finds patterns in numbers, predicts outcomes    │
│  Input:            Structured, numeric feature vectors             │
│  Output:           Numbers (probabilities, rankings, clusters)     │
│                                                                    │
│  Used for:                                                          │
│    Phase 2B  →  Feature importance per school                      │
│    Phase 2B  →  EC archetype clustering                            │
│    Phase 2B  →  Acceptance probability prediction                  │
│                                                                    │
│  Strengths:                                                         │
│    - Finds patterns humans cannot see across 50,000 profiles       │
│    - Fast (milliseconds per prediction)                            │
│    - Cheap ($0 — runs on your server)                              │
│    - Consistent (same input always gives same output)              │
│    - Can quantify: "research adds +14% at MIT"                     │
│                                                                    │
│  Weaknesses:                                                        │
│    - Cannot understand raw text ("FRC 1234" means nothing)         │
│    - Cannot explain WHY (just gives numbers)                       │
│    - Needs structured input (which is why Phase 2A comes first)    │
│    - Needs volume (unreliable below ~5,000 samples)                │
│                                                                    │
│  Question it answers:                                               │
│    "What PATTERNS exist in this data?"                             │
│    "What PROBABILITY does this student have?"                      │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│  HOW THEY WORK TOGETHER                                            │
│  ══════════════════════                                             │
│                                                                    │
│  GenAI                ML                  GenAI                     │
│  (understands)        (finds patterns)    (explains)               │
│                                                                    │
│  "President of     →  has_leadership=1  →  "Your leadership        │
│   robotics club,      has_stem=1           profile matches the     │
│   went to             recognition=         'STEM Researcher'       │
│   nationals"          national             archetype. Students     │
│                       founder=0            like you had a 34%      │
│                       ...                  acceptance rate at       │
│                                            MIT."                   │
│                                                                    │
│  CANNOT find          CANNOT understand    CANNOT find              │
│  patterns across      raw text             patterns across          │
│  50K profiles                              50K profiles             │
│                                                                    │
│  CAN understand       CAN find that        CAN explain why         │
│  "went to             national recognition "national recognition   │
│  nationals" =         adds +11% per level  matters more than       │
│  national level       at MIT               participation length"   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Decision Matrix: Which Tool for Which Task

```
┌──────────────────────────────────────────┬──────────┬──────────┐
│  Task                                     │  GenAI   │  ML      │
├──────────────────────────────────────────┼──────────┼──────────┤
│  Parse "FRC 1234" → FIRST Robotics        │  YES     │  No      │
│  Parse "started nonprofit" → founder role │  YES     │  No      │
│  Categorize free-text ECs                 │  YES     │  No      │
│  Find which ECs correlate with admission  │  No      │  YES     │
│  Cluster students into archetypes         │  No      │  YES     │
│  Predict acceptance probability           │  No      │  YES     │
│  Quantify "how much does research help?"  │  No      │  YES     │
│  Explain patterns to a parent             │  YES     │  No      │
│  Generate personalized recommendations    │  YES     │  No      │
│  Verify admission letter (Gold tier)      │  YES     │  No      │
│  Detect anomalous submissions             │  Either  │  Either  │
│  Parse Reddit posts into structured data  │  YES     │  No      │
└──────────────────────────────────────────┴──────────┴──────────┘
```

---

## Rollout Timeline & Triggers

```
┌──────────────────────────────────────────────────────────────────┐
│  TIMELINE                                                         │
│                                                                    │
│  NOW         5K ECs        25K ECs        50K ECs                 │
│   │            │              │              │                     │
│   ▼            ▼              ▼              ▼                     │
│  ┌────────┐  ┌────────┐    ┌────────┐    ┌────────┐              │
│  │Phase 2A│  │Backfill│    │Phase 2B│    │Phase 2C│              │
│  │Build   │  │complete│    │Build   │    │Build   │              │
│  │GenAI   │  │        │    │ML      │    │GenAI   │              │
│  │parser  │  │        │    │models  │    │explain │              │
│  └────────┘  └────────┘    └────────┘    └────────┘              │
│                                                                    │
│  Est. dates (assuming March 2026 launch):                         │
│  Phase 2A: April 2026 (build during/after launch)                 │
│  Backfill: April 2026 (run against ~3,100 Reddit outcomes)        │
│  Phase 2B: ~Q3 2026 (when organic submissions + Reddit reach 25K) │
│  Phase 2C: ~Q4 2026 (when patterns are statistically robust)     │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

| Phase | What | Trigger | Est. Cost | Priority |
|-------|------|---------|-----------|----------|
| **2A** | GenAI EC parsing + activities table | Build next (post-launch) | ~$131 Year 1 | **High** |
| **2A.1** | Backfill existing Reddit data | After 2A ships | ~$31 one-time | **High** |
| **2A.2** | Parse on new user submissions (async) | After 2A ships | ~$0.01/submission | **High** |
| **2A.3** | Display structured ECs on submission detail pages | After 2A.1 | $0 (frontend only) | **Medium** |
| **2B** | ML feature importance + clustering + predictor | 25K parsed ECs | ~$0 (CPU) | **Medium** |
| **2B.1** | Integrate ML into chances calculator | After 2B ships | ~$0 | **Medium** |
| **2C** | GenAI explanation layer | 50K parsed ECs | ~$0.01/query | **Medium** |
| **2D** | "What should I do?" action recommendations | After 2C ships | Included in 2C | **Future** |

---

## Monetization Tiers

```
┌──────────────────────────────────────────────────────────────────┐
│  FREE TIER                                                        │
│  ══════════                                                       │
│                                                                    │
│  What they see:                                                    │
│    "Your EC profile archetype: Well-Rounded Leader"               │
│    "Most common archetype among MIT admits: STEM Researcher"      │
│    Basic chances calculator (Reach / Match / Safety)              │
│                                                                    │
│  Purpose: Hook. Get users interested enough to submit or pay.     │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│  PAID TIER ($9.99/mo or $59.99/yr)                                │
│  ══════════════════════════════════                                │
│                                                                    │
│  What they see:                                                    │
│    Per-school EC feature importance rankings                      │
│      "Research adds +14% at MIT, +3% at UCLA"                    │
│    EC-filtered acceptance rates                                    │
│      "Students with your EC profile: 34% at GT, 8% at MIT"      │
│    Full personalized GenAI explanation                             │
│      "Here's why, here's what's missing, here's what to do"     │
│    "Students like me" filtered by EC profile match                │
│      Browse individuals with similar activities                   │
│    Historical EC trends                                            │
│      "Research has become 2x more important at Stanford in 3 yrs"│
│                                                                    │
│  Purpose: Revenue. This is the $5,000 consultant insight for $10. │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Competitive Moat Analysis

```
┌──────────────────────────────────────────────────────────────────┐
│  WHAT THIS PIPELINE CREATES (that nobody else has)                │
│                                                                    │
│  1. 50K+ individually parsed, structured EC records               │
│     → Nobody else has this at this granularity                    │
│                                                                    │
│  2. Per-school EC feature importance                               │
│     → "Research matters 3x more at MIT than at UVA"              │
│     → Currently only available anecdotally from $5K consultants   │
│                                                                    │
│  3. EC archetype clustering with acceptance rates                  │
│     → "STEM Researcher profile: 34% at MIT, 8% at UVA"          │
│     → Nobody has ever published this analysis                     │
│                                                                    │
│  4. "Students like you" filtered by EC profile                    │
│     → The query that justifies the subscription                   │
│     → Requires individual-level data nobody else collects         │
│                                                                    │
│  5. Actionable recommendations backed by data                     │
│     → "Adding research would boost your MIT chances by +14%"     │
│     → Empowerly charges $5K-$9K for this, based on anecdotes     │
│     → We deliver it for $10/mo, backed by 50K data points        │
│                                                                    │
│  DEFENSIBILITY:                                                    │
│  The data compounds. Every admissions cycle adds another year      │
│  of outcomes. The ML models get better with more data. A           │
│  competitor starting today would need years to match the dataset.  │
│  This is the same moat that makes Levels.fyi hard to displace.   │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Claude API cost spikes** | Medium | Batch process overnight, cache results, set budget alerts at $50/mo. Use Haiku for simple parses, Sonnet for complex ones. |
| **Low-quality EC text (too vague to parse)** | Medium | Flag low-confidence parses (`parse_confidence < 0.7`) for manual review. Fall back to `category: "other"`. Store raw_text for re-parsing. |
| **GenAI hallucination (invents details not in text)** | Medium | Validate all output against taxonomy enums server-side. Reject any activity where `category` is not in the allowed list. Compare parsed activity count to input line count as sanity check. |
| **ML patterns reflect correlation, not causation** | High | Always frame as "correlated with" not "causes acceptance." Add disclaimer: "Based on historical patterns from community-reported data. Individual results vary." Legal review before launch. |
| **Small sample sizes per school** | High | Only show patterns for schools with 50+ submissions. Display sample size prominently. Show confidence intervals. Do not generate insights for schools with <20 data points. |
| **Taxonomy needs to evolve** | Low | Version the taxonomy (`taxonomy_version` field). Store `raw_text` so data can be re-parsed as categories improve. Backfill script is idempotent and resumable. |
| **Privacy: EC text could identify individuals** | Medium | Never display raw_text from Reddit-sourced data on public pages. Only show structured/categorized fields. Individual profiles require auth + submission gate. |
| **Bias in training data** | High | Reddit/CC skews toward high-achieving, affluent, overrepresented demographics. Acknowledge bias in methodology docs. Weight or stratify models to reduce demographic skew. Transparently show demographic breakdown of training data. |

---

## Cost Projections

```
┌──────────────────────────────────────────────────────────────────┐
│  PHASE 2A COSTS (GenAI Extraction)                                │
│                                                                    │
│  ┌─────────────────────┬──────────┬─────────────────────────────┐│
│  │ Data Source           │ Records  │ Cost at ~$0.01/profile      ││
│  ├─────────────────────┼──────────┼─────────────────────────────┤│
│  │ Existing Reddit data  │ ~3,100   │ ~$31 (one-time backfill)   ││
│  │ New user submissions  │ ~10,000  │ ~$100 (Year 1 projection)  ││
│  │ College Confidential  │ ~5,000   │ ~$50 (if/when ingested)    ││
│  │ Total Year 1          │ ~18,100  │ ~$181                      ││
│  └─────────────────────┴──────────┴─────────────────────────────┘│
│                                                                    │
│  PHASE 2B COSTS (ML Training & Serving)                           │
│                                                                    │
│  Training: $0 (CPU, seconds per model, local or GitHub Action)    │
│  Serving: $0 (static JSON on CDN or lightweight serverless fn)    │
│  Retraining: $0 (monthly cron, no GPU needed)                     │
│                                                                    │
│  PHASE 2C COSTS (GenAI Explanation)                               │
│                                                                    │
│  ┌─────────────────────┬──────────┬─────────────────────────────┐│
│  │ Users                 │ Queries  │ Cost at ~$0.01/query        ││
│  ├─────────────────────┼──────────┼─────────────────────────────┤│
│  │ 5,000 users           │ ~2,500   │ ~$25/month                 ││
│  │ 10,000 users          │ ~5,000   │ ~$50/month                 ││
│  │ 25,000 users          │ ~12,500  │ ~$125/month                ││
│  │ 50,000 users          │ ~25,000  │ ~$250/month                ││
│  └─────────────────────┴──────────┴─────────────────────────────┘│
│                                                                    │
│  Note: Phase 2C queries are ONLY for paid subscribers.             │
│  At 3% conversion: 25K users → 750 subscribers → $7,500 revenue  │
│  Cost: $125. Margin: 98.3%.                                       │
│                                                                    │
│  TOTAL PIPELINE COST (Year 1, assuming 25K users reached)         │
│  ═══════════════════════════════════════════════════════           │
│  Phase 2A: ~$181                                                   │
│  Phase 2B: ~$0                                                     │
│  Phase 2C: ~$125/month (only when subscribers exist to fund it)   │
│  ─────────────────────────────                                     │
│  Year 1 total: ~$181 + ~$750 = ~$931                              │
│  Funded by: Premium subscriptions ($7,500+/month at 25K users)    │
│  Pipeline cost as % of revenue: ~1.0%                             │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

1. **Phase 2A (GenAI parsing) is the foundation.** Everything else depends on having structured EC data. Build this immediately after launch. Cost: ~$31 to backfill existing data.

2. **The pipeline uses GenAI and ML for different jobs.** GenAI understands language (parsing text, explaining results). ML finds patterns in numbers (feature importance, clustering, prediction). Neither can do the other's job well.

3. **This creates the single biggest competitive moat.** No competitor has individual-level, structured EC data at scale. The data compounds every admissions cycle and becomes harder to replicate over time.

4. **The entire pipeline costs <1% of premium revenue.** At 25K users with 3% premium conversion, the pipeline costs ~$931/year against ~$90,000/year in subscription revenue.

5. **The killer feature is "students like me."** Not the ML model, not the archetypes — the ability to say "here are 19 real students with your EC profile who applied to Georgia Tech, and here's what happened." That's the $5,000 consultant insight for $10/month.
