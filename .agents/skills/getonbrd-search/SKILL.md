---
name: getonbrd-search
version: 1.0.0
description: >
  Search live tech job listings on Get on Board (getonbrd.com), the leading
  Latin-American (LATAM) tech job board, via its public JSON API — filtering by
  real posting date and open status, which stale web-search results miss. Postings
  are in Spanish AND English. Use it to find remote / LATAM roles or to look up one
  posting's full detail. Trigger phrases: "Get on Board", "getonbrd", "buscar
  empleos LATAM", "trabajos remotos LATAM", "empleos remotos", "job search Latin
  America", "developer jobs LATAM", "Engineering Manager LATAM", "look up this
  getonbrd posting".
context: fork
allowed-tools: Bash(bun run skills/getonbrd-search/cli/src/cli.ts *)
---

# Get on Board Search Skill

Search live job listings from **[Get on Board](https://www.getonbrd.com)**
(getonbrd.com) — the leading Latin-American tech job board — via its public JSON
API. No authentication, no API key, and **zero runtime dependencies**: it runs
with just `bun`. The market is **LATAM**, and postings are in **Spanish and
English**.

Unlike a plain web search (which surfaces stale, already-closed postings), this
skill reads the API's real `published_at` date so it can filter to genuinely
recent, open roles.

## ⚠️ Personal use only

This tool is for **strictly personal, low-volume job search**. By using it you agree to:

- Use it **only** for your own job search — no commercial, bulk, or automated
  mass scraping.
- **Keep request volume LOW.** Get on Board sits behind Cloudflare, which
  rate-limits aggressively (the same valid query starts returning HTTP 403 after
  a burst). The CLI applies exponential backoff, but you must still throttle usage.
- **Respect the site and its terms.** Use at your own responsibility.

**Robots note (honest disclosure):** getonbrd.com's `robots.txt` allows general
crawlers on `/` but **explicitly Disallows AI bots** — `ClaudeBot`, `GPTBot`,
`CCBot`, `Google-Extended` — and sets `ai-train=no`. This skill is a
human-directed, personal-use lookup tool, not a training crawler; keep it that
way. Do not use it for AI-training data collection or any high-volume automation.

## When to use this skill

- Find tech/engineering/leadership roles in LATAM or remote roles open to LATAM.
- Filter to recently-published, still-open postings (`--jobage`).
- Read the full description of a specific Get on Board posting by its id/slug.

## Commands

### Search job listings

```bash
bun run skills/getonbrd-search/cli/src/cli.ts search --query "<keywords>" [flags]
```

Flags:

| Flag | Meaning |
|------|---------|
| `--query`, `-q <text>` | **Required.** Full-text keywords (title/description). |
| `--location`, `-l <text>` | Location hint. **Get on Board has NO location param on the search API**, so this is **folded into the query string** (e.g. `-l "Santiago"` appends `Santiago` to the keywords). |
| `--jobage <days>` | Keep only jobs published within N days. **Client-side** filter on `published_at` — the API has no server-side date filter. |
| `--page <n>` | 1-indexed page, maps to the API `page` param. Default `1`. |
| `--limit <n>` | Client-side cap on the number of results returned. Default `20`. |
| `--format <fmt>` | `json` (default) \| `table` \| `plain`. |

### Fetch full job detail

```bash
bun run skills/getonbrd-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`<id>` is the `id` from a `search` result (a slug like
`engineering-manager-acme-santiago`). You may also pass a full
`https://www.getonbrd.com/jobs/...` URL. Detail is fetched from the **public HTML
page** (the JSON detail endpoint requires an API key), with entities decoded, tags
stripped, and paragraph breaks preserved.

## Usage examples

```bash
# Engineering Manager roles, quick table scan
bun run skills/getonbrd-search/cli/src/cli.ts search -q "Engineering Manager" --limit 5 --format table

# Recent remote developer roles (published in the last 14 days), JSON
bun run skills/getonbrd-search/cli/src/cli.ts search -q "Desarrollador remoto" --jobage 14 --format json

# Agile Coach roles hinting at Santiago (location folded into the query)
bun run skills/getonbrd-search/cli/src/cli.ts search -q "Agile Coach" -l "Santiago" --format plain

# Tech Lead roles in Buenos Aires
bun run skills/getonbrd-search/cli/src/cli.ts search -q "Tech Lead" -l "Buenos Aires" --format table

# Page 2 of DevOps roles
bun run skills/getonbrd-search/cli/src/cli.ts search -q "DevOps" --page 2 --limit 10 --format table

# Full detail for a specific posting
bun run skills/getonbrd-search/cli/src/cli.ts detail engineering-manager-acme-santiago --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use; feed a result's `id` to `detail`. |
| `table` | Quick human scanning (fit, title, company, location, date, url). |
| `plain` | Reading — search listings, or a single job's full detail. |

Search JSON is `{ "meta": { "count", "page" }, "results": [...] }`. Each result
carries at least `id`, `title`, `company`, `location`, `date` (ISO 8601 from
`published_at`), and `url`, plus `remote` (bool), `salary` (e.g. `"USD 2700-3200"`
or `null`), and a `snippet` (~200 chars of the description, HTML stripped). Missing
values are `null`, never omitted. All errors go to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`.

## Notes (API quirks — read before extending)

- **Company name needs a second call.** The search payload's `company` attribute
  is only a numeric-id reference, not a name. The CLI resolves the name via
  `/companies/<id>` and **caches by id in-memory** (many jobs share a company) to
  keep the request count low.
- **No server-side date filter.** `--jobage` is applied **client-side** by
  comparing `published_at` (UNIX seconds) against the cutoff — the API rejects
  extra params.
- **`--location` is folded into the query.** There is no location param on the
  search API, so a location hint just becomes extra keywords.
- **Cloudflare rate-limits aggressively.** Only `query`, `per_page`, and `page`
  are safe params; adding any other (`expired`, `include`, …) returns HTTP 403.
  A burst of the same query also 403s — the CLI backs off, but keep volume low.
- **Detail uses the public HTML page.** The JSON detail endpoint
  (`/api/v0/jobs/<id>`) returns 401 (needs a key), so `detail` fetches the public
  `/jobs/<slug>` URL (which 301-redirects to its canonical `/jobs/<category>/<slug>`)
  and parses the microdata + description defensively.

See `url-reference.md` for full endpoint documentation.
