# Search Queries for Job Scraper

<!-- Populated by /setup (Path A) for Alejandro D'Ambrosio -->
<!-- Profile: Solutions/Software Architect, 100% remote required, no relocation, no IT consultancies, USD preferred -->

## IMPORTANT: Portal tooling note

The built-in portal-search CLIs shipped with this framework target the **Danish** job market
(Jobindex, Jobbank, Jobdanmark, Jobnet) and are **not applicable** to this profile. Use the
Google `site:` searches and LinkedIn queries below instead, or run `/add-portal` to generate a
search skill for an Argentine / LATAM / global-remote board.

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

### Priority 1: Solutions / Software Architect (primary direction)

Strongest and most desired career direction.

```
site:linkedin.com/jobs "Solutions Architect" remote
site:linkedin.com/jobs "Software Architect" remote
site:getonbrd.com "Solutions Architect" OR "Software Architect" remote
"Solutions Architect" remote Java (USD OR "US dollars") -consultancy
```

### Priority 2: Tech Lead / Staff Engineer

Technical leadership roles that stay hands-on.

```
site:linkedin.com/jobs "Tech Lead" remote Java
site:linkedin.com/jobs "Staff Engineer" remote
site:getonbrd.com "Tech Lead" OR "Staff Engineer" remote
"Staff Engineer" OR "Technical Lead" remote backend (USD OR LATAM)
```

### Priority 3: Domain-strong backend roles (fintech / enterprise Java)

Roles that lean on his banking/fintech and enterprise-Java depth.

```
site:linkedin.com/jobs "Senior Java" remote fintech
site:linkedin.com/jobs "Java" "Spring Boot" remote architect
"backend architect" remote (fintech OR banking) Java
```

### Priority 4: Senior Java Developer (wider net / fallback)

Broader senior IC roles as a fallback.

```
site:linkedin.com/jobs "Senior Java Developer" remote
site:weworkremotely.com Java senior
site:remoteok.com java architect OR "tech lead"
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
- "/scrape architect" -> Priority 1 queries + custom architecture-specific queries
- "/scrape fintech" -> Priority 3 queries + custom fintech-specific queries
