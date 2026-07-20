import {
  API_BASE,
  fetchJson,
  formatJson,
  formatPlain,
  formatTable,
  resolveCompanyName,
  toResult,
  writeError,
  type JobResult,
  type SearchEnvelope,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  jobage?: number // client-side filter: keep jobs published within N days
  page: number // 1-indexed, maps to API `page`
  limit: number // client-side cap on returned results
  location?: string // folded into the query string (no location param exists)
  format: "json" | "table" | "plain"
}

/**
 * Build the search URL. ONLY query/per_page/page are safe — adding any other
 * param (expired, include, …) trips the Cloudflare WAF (403). `--location` has no
 * dedicated param, so it is appended into the free-text query.
 */
function buildUrl(opts: SearchOpts): string {
  const query = [opts.query, opts.location].filter(Boolean).join(" ").trim()
  const params = new URLSearchParams()
  params.set("query", query)
  // Request a page sized to the client-side cap so one API page usually suffices.
  params.set("per_page", String(Math.min(Math.max(opts.limit, 1), 100)))
  params.set("page", String(opts.page))
  return `${API_BASE}/search/jobs?${params.toString()}`
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = buildUrl(opts)
    const env = await fetchJson<SearchEnvelope>(url)
    let records = env?.data ?? []

    // Client-side --jobage filter: no server-side date filter exists, so compare
    // published_at (UNIX seconds) against the cutoff here.
    if (typeof opts.jobage === "number" && opts.jobage > 0) {
      const cutoff = Math.floor(Date.now() / 1000) - opts.jobage * 86400
      records = records.filter((r) => (r.attributes.published_at ?? 0) >= cutoff)
    }

    // Client-side cap.
    records = records.slice(0, opts.limit)

    // Resolve company names (cached by numeric id, so shared companies cost one call).
    const results: JobResult[] = []
    for (const rec of records) {
      const companyName = await resolveCompanyName(rec.attributes.company?.data?.id)
      results.push(toResult(rec, companyName))
    }

    if (opts.format === "table") {
      process.stdout.write(formatTable(results) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(formatPlain(results) + "\n")
    } else {
      process.stdout.write(formatJson(results, opts.page) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
