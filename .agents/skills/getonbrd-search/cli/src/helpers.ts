// Data source: the Get on Board public JSON API (https://www.getonbrd.com/api/v0).
// Reads are unauthenticated (no API key), but the site sits behind Cloudflare's
// WAF, which rate-limits aggressively — the SAME valid query starts returning 403
// after a burst. Every request therefore goes through fetchWithBackoff, which
// retries 429/403/5xx with exponential backoff + jitter and keeps volume low.
//
// The search payload is JSON-API ({ data:[{id,type,attributes,links}], meta }).
// Two quirks the reshaping layer papers over:
//   1. The company NAME is not in the search payload — attributes.company is only
//      a numeric-id reference. We resolve it via /companies/<id> and cache by id.
//   2. There is no server-side date filter; --jobage is applied client-side in
//      the search command by comparing published_at (UNIX seconds).

export const API_BASE = "https://www.getonbrd.com/api/v0"
export const SITE_BASE = "https://www.getonbrd.com"

// A real browser User-Agent is mandatory — the API 403s obviously-bot agents.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * GET a URL with a browser UA and exponential backoff + jitter. Retries on
 * 429/403/5xx (Cloudflare rate-limiting and transient server states); returns
 * `null` on 404 rather than throwing so a missing resource degrades gracefully.
 * `accept` picks the content type ("application/json" for the API, "text/html"
 * for detail pages). Follows redirects — the detail public_url 301s to its
 * canonical /jobs/<category>/<slug>.
 */
export async function fetchWithBackoff(
  url: string,
  accept: "application/json" | "text/html" = "application/json",
): Promise<Response | null> {
  const maxRetries = 6
  let delay = 700

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let response: Response
    try {
      response = await fetch(url, {
        headers: { "User-Agent": UA, Accept: accept },
        redirect: "follow",
      })
    } catch (e) {
      // DNS / connection failure: retry a couple of times, then give up.
      if (attempt === maxRetries) {
        throw new Error(`could not reach Get on Board (${e instanceof Error ? e.message : String(e)})`)
      }
      await sleep(delay + Math.floor(Math.random() * 400))
      delay = Math.min(delay * 2, 15000)
      continue
    }

    if (response.status === 404) return null

    // 403 here is Cloudflare rate-limiting, not a hard auth failure — back off.
    if (response.status === 429 || response.status === 403 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Get on Board request failed: ${response.status} ${response.statusText} (${url})`)
      }
      await sleep(delay + Math.floor(Math.random() * 400))
      delay = Math.min(delay * 2, 15000)
      continue
    }

    if (!response.ok) {
      throw new Error(`Get on Board request failed: ${response.status} ${response.statusText} (${url})`)
    }
    return response
  }
  throw new Error("Get on Board request failed after retries")
}

/** GET + parse JSON via the backoff layer. Null on 404. */
export async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetchWithBackoff(url, "application/json")
  if (!res) return null
  const body = (await res.json().catch(() => null)) as T | null
  if (body === null) throw new Error(`Get on Board returned an unparseable JSON body (${url})`)
  return body
}

/** GET raw HTML via the backoff layer. Null on 404. */
export async function fetchHtml(url: string): Promise<string | null> {
  const res = await fetchWithBackoff(url, "text/html")
  if (!res) return null
  return res.text()
}

// ---------------------------------------------------------------------------
// JSON-API wire shapes (only the fields this skill reads)
// ---------------------------------------------------------------------------

export interface JobAttributes {
  title: string
  description?: string | null
  description_headline?: string | null
  functions?: string | null
  desirable?: string | null
  benefits?: string | null
  category_name?: string | null
  published_at: number // UNIX timestamp, seconds
  remote?: boolean
  remote_modality?: string | null
  remote_zone?: string | null
  min_salary?: number | null
  max_salary?: number | null
  countries?: string[] | null
  seniority?: string | null
  tags?: string[] | null
  applications_count?: number | null
  lang?: string | null
  company?: { data?: { id?: number | string } } | null
}

export interface JobRecord {
  id: string // slug
  type: string
  attributes: JobAttributes
  links?: { public_url?: string }
}

export interface SearchEnvelope {
  data: JobRecord[]
  meta?: { page?: number; per_page?: number; total_pages?: number }
}

// ---------------------------------------------------------------------------
// Contract result shapes
// ---------------------------------------------------------------------------

/** A search result in the portal-skill contract shape. Missing values are null. */
export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null // ISO 8601 derived from published_at
  url: string
  remote: boolean
  salary: string | null
  snippet: string | null
}

// ---------------------------------------------------------------------------
// Company name resolution (with in-memory cache)
// ---------------------------------------------------------------------------

interface CompanyEnvelope {
  data?: { id?: string; attributes?: { name?: string } }
}

const companyCache = new Map<string, string | null>()

/**
 * Resolve a company's display name from its numeric id via /companies/<id>.
 * Many jobs share a company, so results are cached in-memory by id to keep the
 * request count (and Cloudflare pressure) low. Null when unresolved.
 */
export async function resolveCompanyName(id: number | string | undefined): Promise<string | null> {
  if (id === undefined || id === null || id === "") return null
  const key = String(id)
  if (companyCache.has(key)) return companyCache.get(key) ?? null
  try {
    const env = await fetchJson<CompanyEnvelope>(`${API_BASE}/companies/${encodeURIComponent(key)}`)
    const name = env?.data?.attributes?.name ?? null
    companyCache.set(key, name)
    return name
  } catch {
    // A single company lookup failing must not sink the whole search.
    companyCache.set(key, null)
    return null
  }
}

// ---------------------------------------------------------------------------
// Field derivation
// ---------------------------------------------------------------------------

/** UNIX seconds -> ISO 8601 string, or null when absent/invalid. */
export function publishedToIso(ts: number | null | undefined): string | null {
  if (typeof ts !== "number" || !isFinite(ts) || ts <= 0) return null
  return new Date(ts * 1000).toISOString()
}

/** Human-readable salary line, e.g. "USD 2700-3200", or null when absent. */
export function formatSalary(min: number | null | undefined, max: number | null | undefined): string | null {
  const lo = typeof min === "number" && min > 0 ? min : null
  const hi = typeof max === "number" && max > 0 ? max : null
  if (lo === null && hi === null) return null
  if (lo !== null && hi !== null) return lo === hi ? `USD ${lo}` : `USD ${lo}-${hi}`
  return `USD ${lo ?? hi}`
}

/** Location string from the countries array + remote info. Null when unknown. */
export function deriveLocation(a: JobAttributes): string | null {
  const parts: string[] = []
  for (const c of a.countries ?? []) if (c) parts.push(c)
  if (a.remote) {
    const zone = a.remote_zone && a.remote_zone.trim()
    parts.push(zone && zone.toLowerCase() !== "remote" ? `Remote (${zone})` : "Remote")
  }
  // Dedupe case-insensitively (a remote job's country is often literally "Remote").
  const seen = new Set<string>()
  const unique = parts.filter((p) => {
    const k = p.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  return unique.length ? unique.join(" · ") : null
}

// ---------------------------------------------------------------------------
// HTML → text (entity decode + tag strip + paragraph preservation)
// ---------------------------------------------------------------------------

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&hellip;/gi, "…")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
}

/**
 * Strip HTML into readable prose: block/line-break tags become newlines,
 * script/style are dropped, entities are decoded, remaining tags removed and
 * whitespace collapsed while paragraph breaks are preserved. Null for empty.
 */
export function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null
  const withBreaks = html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, " ")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/\s*(p|li|ul|ol|div|h[1-6]|tr|section|header)\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
  const text = decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return text || null
}

/** A short single-line snippet (~maxLen chars) from an HTML description. */
export function snippet(html: string | null | undefined, maxLen = 200): string | null {
  const text = stripHtml(html)
  if (!text) return null
  const flat = text.replace(/\s+/g, " ").trim()
  if (flat.length <= maxLen) return flat
  return flat.slice(0, maxLen).replace(/\s+\S*$/, "") + "…"
}

// ---------------------------------------------------------------------------
// Reshape
// ---------------------------------------------------------------------------

/** Reshape a search record + resolved company name into the contract result. */
export function toResult(rec: JobRecord, companyName: string | null): JobResult {
  const a = rec.attributes
  return {
    id: rec.id,
    title: a.title || "(untitled)",
    company: companyName,
    location: deriveLocation(a),
    date: publishedToIso(a.published_at),
    url: rec.links?.public_url || `${SITE_BASE}/jobs/${rec.id}`,
    remote: Boolean(a.remote),
    salary: formatSalary(a.min_salary, a.max_salary),
    snippet: snippet(a.description),
  }
}

// ---------------------------------------------------------------------------
// Output formatters
// ---------------------------------------------------------------------------

/** The contract JSON envelope, pretty-printed. */
export function formatJson(results: JobResult[], page: number): string {
  return JSON.stringify({ meta: { count: results.length, page }, results }, null, 2)
}

interface Column {
  header: string
  width: number
  cell: (r: JobResult) => string
}

/** Aligned columnar table for human scanning. */
export function formatTable(results: JobResult[]): string {
  if (results.length === 0) return "No results."
  const columns: Column[] = [
    { header: "FIT", width: 3, cell: (r) => (r.remote ? "REM" : "—") },
    { header: "TITLE", width: 38, cell: (r) => r.title },
    { header: "COMPANY", width: 22, cell: (r) => r.company ?? "—" },
    { header: "LOCATION", width: 24, cell: (r) => r.location ?? "—" },
    { header: "DATE", width: 10, cell: (r) => (r.date ? r.date.slice(0, 10) : "—") },
    // The URL column is sized to the longest URL so it is never truncated —
    // a cut URL cannot be opened. Fixed-width columns above truncate for scanning.
    { header: "URL", width: Math.max(3, ...results.map((r) => r.url.length)), cell: (r) => r.url },
  ]
  const row = (cells: string[]) =>
    cells.map((c, i) => c.slice(0, columns[i].width).padEnd(columns[i].width)).join("  ")
  const header = row(columns.map((c) => c.header))
  const body = results.map((r) => row(columns.map((c) => c.cell(r))))
  return [header, "-".repeat(header.length), ...body].join("\n")
}

/** Readable multi-line plain listing for search results. */
export function formatPlain(results: JobResult[]): string {
  if (results.length === 0) return "No results."
  return results
    .map((r) =>
      [
        r.title,
        `  ${r.company ?? "—"} · ${r.location ?? "—"} · ${r.date ? r.date.slice(0, 10) : "—"}${
          r.salary ? ` · ${r.salary}` : ""
        }`,
        `  id: ${r.id}`,
        `  ${r.url}`,
        r.snippet ? `  ${r.snippet}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n")
}
