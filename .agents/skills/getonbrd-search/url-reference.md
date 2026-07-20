# Get on Board — API & scraping reference

Everything a future maintainer needs when getonbrd.com changes. Verified live
(2026-07). Public JSON API under `https://www.getonbrd.com/api/v0`, **no auth**.

Always send:
- `User-Agent`: a real browser UA (an obvious-bot UA is 403'd).
- `Accept: application/json` (API) or `text/html` (detail pages).

## 1. Search — `GET /api/v0/search/jobs`

```
GET https://www.getonbrd.com/api/v0/search/jobs?query=<urlencoded>&per_page=<n>&page=<n>
```

**Safe params — ONLY these three.** Adding any other param (`expired`, `include`,
`remote`, `category`, …) trips the Cloudflare WAF and returns **HTTP 403
Forbidden**. Do NOT send them.

| Param | Meaning |
|-------|---------|
| `query` | URL-encoded free-text keywords. There is **no location param** — fold any location into `query`. |
| `per_page` | Results per page. |
| `page` | 1-indexed page number. |

### Response (JSON-API envelope)

```jsonc
{
  "data": [
    {
      "id": "<slug>",              // e.g. "technical-product-owner-tpo-coderslab-io-santiago"
      "type": "job",
      "attributes": { /* see below */ },
      "links": { "public_url": "https://www.getonbrd.com/jobs/<slug>" }
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total_pages": 48 }
}
```

### `attributes` fields this skill reads

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | |
| `description` | HTML string | **FULL** text — no separate call needed for search snippets. |
| `description_headline`, `functions`, `desirable`, `benefits`, `projects` | HTML | Extra sections. |
| `category_name` | string | |
| `published_at` | **integer (UNIX seconds)** | Basis for the client-side `--jobage` filter. |
| `remote` | bool | |
| `remote_modality` | string | `"remote"` \| `"hybrid"` \| … |
| `remote_zone` | string | e.g. a region the remote role is open to. |
| `min_salary`, `max_salary` | int \| null | USD per month; may be null. |
| `countries` | string[] | Plain country names (e.g. `["Chile"]`). |
| `location_cities`, `location_regions` | `{data:[{id,type}]}` | **ID references, NOT names** — this skill does not resolve them; it uses `countries` + remote info for location. |
| `seniority`, `tags` | string / string[] | |
| `applications_count`, `lang` | int / string | |
| `company` | `{ "data": { "id": <numeric_id>, "type": "company" } }` | **Company NAME is NOT here** — resolve via §2. |

### Date filtering — CLIENT-SIDE ONLY

There is **no server-side date filter**. `--jobage <days>` is applied by the CLI:
keep records where `published_at >= floor(now/1000) - days*86400`.

## 2. Company name resolution — `GET /api/v0/companies/<numeric_id>`

The search payload only carries `company.data.id` (numeric). Resolve the display
name:

```
GET https://www.getonbrd.com/api/v0/companies/13859
```

```jsonc
{ "data": { "id": "<company-slug>", "attributes": { "name": "<Company Name>", "country": "CL", "web": "…" } } }
```

Public, no auth. **Cache results in-memory by numeric id** — many jobs share a
company, so caching minimizes requests (and Cloudflare pressure).

## 3. Job detail — use the PUBLIC HTML page (not the API)

The JSON detail endpoint **`GET /api/v0/jobs/<id>` returns HTTP 401 Unauthorized**
(needs an API key). **Do NOT use it.**

Instead fetch the public HTML page. The listing `public_url` returns a **301
redirect** and must be followed to the canonical URL:

```
GET https://www.getonbrd.com/jobs/<slug>
  → 301 → https://www.getonbrd.com/jobs/<category>/<slug>   (HTTP 200, ~200 KB HTML)
```

The canonical page carries the company name and full description as **schema.org
microdata** (there is no JSON-LD `<script>`). Fields extracted defensively:

| Data | Where in the HTML |
|------|-------------------|
| Title | `<span itemprop="title">…</span>` |
| Company name | `itemprop="hiringOrganization"` block → `<img alt="…">`, fallback `/companies/<slug>` href, fallback `"… in <Company>"` span. |
| Posted date | `<time datetime="2026-07-20T15:03:12+00:00" itemprop="datePosted">` (value on the `datetime` attribute). |
| Salary | `content="2700" itemprop="minValue"`, `content="3200" itemprop="maxValue"`, `content="USD" itemprop="currency"`. |
| Employment type | `<span itemprop="employmentType">FULL_TIME</span>` |
| Location | `itemprop="jobLocation"` → `.location` text. |
| Description | `itemprop="description">` block, sliced to the next section marker (skills/qualifications/footer) then HTML-stripped. |

Each extractor is wrapped so one malformed section cannot break the whole parse.

## 4. Cloudflare behavior (IMPORTANT)

- The WAF **rate-limits aggressively**: the *same* valid query returns 403 after a
  burst of requests.
- **Exponential backoff with jitter (max ~6 retries) on 429/403/5xx is
  mandatory.** 403 here means "slow down", not "forbidden forever".
- 404 → return null/empty rather than crash.
- Keep total request volume LOW. Company-name caching and requesting a single
  page sized to `--limit` are the main volume-reduction levers.

## 5. robots.txt / terms

`robots.txt` allows `*` on `/` (`search=yes`) but **Disallows AI bots**
(`ClaudeBot`, `GPTBot`, `CCBot`, `Google-Extended`) and sets `ai-train=no`. This
skill is a human-directed, personal, low-volume lookup tool — not a training
crawler. Do not use it for bulk/automated/commercial scraping.
