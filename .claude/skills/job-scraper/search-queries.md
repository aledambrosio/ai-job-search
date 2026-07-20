# Search Queries for Job Scraper

<!-- Populated by /setup (Path A) for Alejandro D'Ambrosio -->
<!-- Profile: PRIMARY Engineering Manager (people-focused leadership pivot). SECONDARY track: Delivery Manager/Lead, Agile Coach, Technical Program Manager, Head of Engineering. -->
<!-- 100% remote required, no relocation, no IT consultancies, USD 5,000/month minimum. Leverages Ontological Coaching (CAYZEN) + leadership of 40+ devs. Technical depth (Java/iOS/architecture) is now a DIFFERENTIATOR, not the day-to-day. Staff Engineer / pure-IC tracks discarded. -->

## IMPORTANT: Portal tooling note

**Installed CLI (primary — use first):** `getonbrd-search` at `.agents/skills/getonbrd-search/`
queries Get on Board (getonbrd.com, LATAM tech board) via its public JSON API and filters by
**real posting date / open status** — which the `site:` WebSearches below miss (they surface stale,
already-closed postings). Prefer it for the Engineering Manager / management / coaching tracks:

```bash
bun run skills/getonbrd-search/cli/src/cli.ts search -q "Engineering Manager" --jobage 14 --limit 20 --format json
```

Use `--jobage 14` to honor the 14-day recency rule, and feed a result's `id` to `detail`.
Personal, low-volume use only (see the skill's SKILL.md).

The built-in portal-search CLIs shipped with this framework target the **Danish** job market
(Jobindex, Jobbank, Jobdanmark, Jobnet) and are **not applicable** to this profile. For portals
**without** a CLI, use the Google `site:` searches and LinkedIn queries below, or run `/add-portal`
to generate a search skill for another board.

**Note on `freehire-search`:** its faceted filtering is tech-IC-first (`--seniority` = junior/
middle/senior/staff/principal/lead). It is **weak for people-management roles** (Engineering
Manager, Delivery Manager, Agile Coach) because those are not IC seniority levels. Use
**LinkedIn** as the primary source for the management/coaching tracks below; keep freehire for
the technical-fallback queries only.

## Search Sites

Primary (remote-focused, global + LATAM):
- **linkedin.com/jobs** - filter to Remote; Argentina, LATAM, and global postings
- **getonbrd.com** (Get on Board) - LATAM tech roles, many remote/USD
- **weworkremotely.com** - global remote
- **remoteok.com** - global remote tech
- **remotive.com** - global remote tech

Secondary (company career pages via Google):
- Direct Google searches with `site:` filters for target product/service companies

## Query Categories

Every query should include a remote qualifier (`remote` / `remoto`) since 100% remote is required.
Exclude IT consultancies/staffing where the site allows it.

### Priority 1: Engineering Manager (primary direction)

The main bet: people-focused leadership of software teams. Ontological Coaching + leadership of
40+ devs is the differentiator; 18+ years of engineering earns technical trust without owning the code.

```
site:linkedin.com/jobs "Engineering Manager" remote
site:linkedin.com/jobs "Engineering Manager" remote (Argentina OR LATAM)
site:getonbrd.com "Engineering Manager" remote
"Engineering Manager" remote software (USD OR LATAM) -consultancy
```

### Priority 2: Delivery Manager / Delivery Lead (secondary track)

Coordination, stakeholders, and delivery flow across dev teams.

```
site:linkedin.com/jobs "Delivery Manager" remote software
site:linkedin.com/jobs "Delivery Lead" remote engineering
site:getonbrd.com "Delivery Manager" OR "Delivery Lead" remote
"Engineering Delivery Manager" remote (USD OR LATAM) -consultancy
```

### Priority 3: Agile Coach / Team Coach + Technical Program Manager (secondary track)

Coaching-centric and cross-team coordination roles, where Ontological Coaching is the core asset.

```
site:linkedin.com/jobs "Agile Coach" remote
site:linkedin.com/jobs "Technical Program Manager" remote
site:getonbrd.com "Agile Coach" OR "Technical Program Manager" remote
"Agile Coach" OR "Team Coach" remote (USD OR LATAM) -consultancy
```

### Priority 4: Head of Engineering / Director + people-leaning Tech Lead (stretch / fallback)

Aspirational people-leadership stretch, plus a technical-leadership fallback that keeps human contact.

```
site:linkedin.com/jobs "Head of Engineering" remote
site:linkedin.com/jobs "Director of Engineering" remote
site:linkedin.com/jobs "Tech Lead" remote (mentoring OR "people management")
"Head of Engineering" OR "Engineering Director" remote (USD OR LATAM) -consultancy
```

## Location / Remote Filter

Since 100% remote is a hard requirement and relocation is off the table, filter on **work mode**,
not commute distance:

- **100% remote (from Argentina / LATAM):** PASS
- **Global remote paying in USD:** PASS + flag as a plus
- **Hybrid or any required on-site presence:** REJECT
- **Requires relocation:** REJECT
- **Employer is an IT consultancy / staffing firm:** REJECT (prefers internal role at a product or service company)

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet
passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3
custom queries for that focus. For example:
- "/scrape em" or "/scrape manager" -> Priority 1 queries + custom Engineering-Manager-specific queries
- "/scrape coach" -> Priority 3 queries + custom Agile-Coach / coaching-specific queries
- "/scrape tpm" -> Priority 3 queries + Technical Program Manager queries
- "/scrape tech lead" -> Priority 4 queries + people-leaning Tech Lead queries
