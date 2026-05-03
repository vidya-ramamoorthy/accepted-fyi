# 005: CDS Scraper Next Steps

**Date:** 2026-03-09
**Status:** Planned

## Current State

- **CDS scraper** (`scripts/ingest-cds.ts`) scrapes commondatasets.fyi using Puppeteer
- **Data year:** 2023-2024 (Class of 2027), hardcoded on line 525
- **Coverage:** 12 Ivy+ schools only (Harvard, MIT, Stanford, Princeton, Yale, Columbia, UChicago, Johns Hopkins, UPenn, Dartmouth, Brown, Cornell)
- **commondatasets.fyi limitation:** Site only has 2023-2024 data for these 12 schools, no year selector, no additional schools. Dead end for newer data.
- **Fields populated:** ED/EA applicant/admitted counts, waitlist stats, admission factor importance ratings, GPA distributions, financial aid (partial)

## What's Available from School Websites

Schools publish CDS directly on their institutional research (IR) pages, typically as PDFs. As of March 2026:

| School | Latest CDS | URL | Notes |
|--------|-----------|-----|-------|
| Cornell | 2024-2025 | irp.dpb.cornell.edu/university-factbook/common-data-set | Published July 2025 |
| Yale | 2024-2025 | oir.yale.edu/common-data-set | Published June 2025 |
| Brown | 2024-2025 | oir.brown.edu/institutional-data/common-data-set | Available |
| Harvard | Unknown | oir.harvard.edu/common-data-set | Returns 403 (blocks automated access) |
| MIT | Unknown | oir.mit.edu/common-data-set | Connection refused |
| Stanford | Unknown | ir.stanford.edu/common-data-set | Connection refused |
| Princeton | Unknown | registrar.princeton.edu/.../common-data-set | Returns 403 |

**Key takeaway:** 2024-2025 CDS (Class of 2028) is available for at least 3 schools, likely more. This is one full cycle newer than what we have. Some schools block automated access, so manual PDF download may be needed for those.

## Proposed: AI-Powered CDS PDF Parser

### Why

- commondatasets.fyi is stuck on 2023-2024 and only covers 12 schools
- Schools publish CDS as PDFs with varying formats
- AI extraction handles format variation without per-school parsing logic
- Scales to 50+ schools without writing custom parsers

### How

New script: `scripts/ingest-cds-pdf.ts`

1. Maintain a JSON config file (`scripts/cds-pdf-urls.json`) mapping school names to CDS PDF URLs and data years
2. Download each PDF
3. Send to Claude Haiku with a structured extraction prompt
4. Extract the same fields the current scraper handles:
   - Section C1: ED/EA applicant and admitted counts
   - Section C2: Waitlist offered/accepted/admitted
   - Section C7: 15 admission factor importance ratings
   - Section C10-C12: GPA distribution percentages
   - Section H: Financial aid (percent need met, avg aid package, merit aid)
5. Upsert into `schools` table, update `cdsDataYear` and `cdsSourceUrl`

### Cost Estimate

- Claude Haiku per PDF: ~$0.01-0.02 (CDS PDFs are 20-40 pages, only need to send admissions sections)
- 50 schools: ~$0.50-1.00 total
- 200 schools: ~$2-4 total

### Config File Format

```json
[
  {
    "schoolName": "Cornell University",
    "pdfUrl": "https://irp.dpb.cornell.edu/sites/default/files/CDS_2024-2025.pdf",
    "dataYear": "2024-2025"
  },
  {
    "schoolName": "Yale University",
    "pdfUrl": "https://oir.yale.edu/sites/default/files/cds_2024-2025.pdf",
    "dataYear": "2024-2025"
  }
]
```

### Schools That Block Automated Access

For Harvard, MIT, Stanford, Princeton, and others that return 403/ECONNREFUSED:
- Manually download the PDF from the school's IR page
- Save to `scripts/cds-pdfs/` directory
- Script supports both URL download and local file path

### Implementation Steps

1. Create `scripts/cds-pdf-urls.json` with URLs for all schools where 2024-2025 CDS is available
2. Build `scripts/ingest-cds-pdf.ts`:
   - PDF download (with User-Agent header)
   - Claude Haiku extraction with structured output schema
   - Validation (sanity check numbers: acceptance rates 0-100%, applicant counts > 0, etc.)
   - Dry-run mode (parse and display without writing to DB)
   - Upsert to `schools` table
3. Run for all available 2024-2025 CDS PDFs
4. For blocked schools, manually download and run in local-file mode
5. Add `npm run ingest:cds-pdf` to package.json

### Timeline

- **Now:** Run existing CDS scraper for 2023-2024 data (done, 12 schools populated)
- **Next:** Build PDF parser, start with the 3 confirmed 2024-2025 schools (Cornell, Yale, Brown)
- **Then:** Curate PDF URLs for 30-50 top schools, run batch ingestion
- **Ongoing:** Re-run each fall/winter as schools publish new CDS data

## Also Consider: Expanding commondatasets.fyi Scraper

If commondatasets.fyi updates to 2024-2025 or adds more schools in the future, the existing Puppeteer scraper can be reused with minimal changes (just update the `cdsDataYear` constant and add schools to `CDS_SCHOOLS` array). Worth checking periodically but not worth depending on.
