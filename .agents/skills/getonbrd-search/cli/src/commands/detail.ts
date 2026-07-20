import {
  SITE_BASE,
  decodeHtmlEntities,
  fetchHtml,
  formatSalary,
  stripHtml,
  writeError,
} from "../helpers.js"

export interface DetailOpts {
  id: string // a Get on Board slug or a full /jobs/... URL
  format: "json" | "plain"
}

export interface JobDetail {
  id: string
  title: string | null
  company: string | null
  location: string | null
  date: string | null
  salary: string | null
  employment_type: string | null
  url: string
  description: string | null
}

/** Turn a bare slug or a full URL into the public detail URL (which 301s to canonical). */
export function normalizeDetailUrl(input: string): { slug: string; url: string } | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  // A full getonbrd URL: use it directly (redirects are followed by the fetcher).
  const urlMatch = trimmed.match(/getonbrd\.com\/jobs\/(?:[^/?#]+\/)?([^/?#]+)/i)
  if (urlMatch) return { slug: urlMatch[1], url: trimmed.split(/[?#]/)[0] }
  // A bare slug: alphanumerics, hyphens, dots (company slugs can contain dots).
  if (/^[a-z0-9][a-z0-9._-]*$/i.test(trimmed)) {
    return { slug: trimmed, url: `${SITE_BASE}/jobs/${trimmed}` }
  }
  return null
}

// --- Defensive microdata extractors -----------------------------------------
// Each is wrapped by `safe()` at the call site so one malformed chunk cannot
// break the whole parse.

function safe<T>(fn: () => T): T | null {
  try {
    return fn()
  } catch {
    return null
  }
}

/**
 * Read a microdata value carried on an attribute (content=/datetime=) of the
 * element bearing itemprop="prop". Handles both attribute orders.
 */
function attrValue(html: string, prop: string): string | null {
  const before = html.match(new RegExp(`(?:content|datetime)="([^"]*)"[^>]*itemprop="${prop}"`, "i"))
  if (before) return before[1]
  const after = html.match(new RegExp(`itemprop="${prop}"[^>]*(?:content|datetime)="([^"]*)"`, "i"))
  if (after) return after[1]
  return null
}

/** The text between `itemprop="prop">` and the next `</...>` — for inline values. */
function inlineText(html: string, prop: string): string | null {
  const m = html.match(new RegExp(`itemprop="${prop}"[^>]*>\\s*([^<]+?)\\s*<`, "i"))
  return m ? decodeHtmlEntities(m[1]).trim() || null : null
}

/** Company display name from the hiringOrganization block (img alt, then /companies/ href). */
function extractCompany(html: string): string | null {
  const orgIdx = html.indexOf('itemprop="hiringOrganization"')
  const block = orgIdx >= 0 ? html.slice(orgIdx, orgIdx + 1200) : ""
  const alt = block.match(/alt="([^"]+)"/i)
  if (alt && alt[1].trim()) return decodeHtmlEntities(alt[1]).trim()
  const slug = block.match(/\/companies\/([^"?#]+)/i)
  if (slug) return slug[1]
  // Fallback: the "… in <Company>" span next to the title.
  const inSpan = html.match(/fake-hidden[^>]*>\s*in\s+([^<]+?)\s*</i)
  return inSpan ? decodeHtmlEntities(inSpan[1]).trim() : null
}

/**
 * Extract the main description block: from `itemprop="description">` up to the
 * nearest following section marker (or a hard cap), then strip to prose.
 */
function extractDescription(html: string): string | null {
  const start = html.indexOf('itemprop="description"')
  if (start < 0) return null
  const bodyStart = html.indexOf(">", start) + 1
  const endMarkers = [
    'itemprop="skills"',
    'itemprop="qualifications"',
    'itemprop="experienceRequirements"',
    "gb-similar",
    'id="apply"',
    "gb-landing-cta",
    "<footer",
  ]
  let end = Math.min(bodyStart + 40000, html.length)
  for (const marker of endMarkers) {
    const idx = html.indexOf(marker, bodyStart)
    if (idx > bodyStart && idx < end) end = idx
  }
  return stripHtml(html.slice(bodyStart, end))
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const target = normalizeDetailUrl(opts.id)
  if (!target) {
    writeError(`could not parse a Get on Board slug/URL from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const html = await fetchHtml(target.url)
    if (!html) {
      writeError("job not found", "NOT_FOUND")
      return 1
    }

    const title = safe(() => inlineText(html, "title"))
    const company = safe(() => extractCompany(html))
    const datePosted = safe(() => attrValue(html, "datePosted"))
    const min = safe(() => attrValue(html, "minValue"))
    const max = safe(() => attrValue(html, "maxValue"))
    const employment = safe(() => inlineText(html, "employmentType"))
    const location = safe(() => {
      const loc = html.match(/itemprop="jobLocation"[\s\S]{0,600}?class="location"[\s\S]{0,400}?>\s*([^<]+?)\s*</i)
      return loc ? decodeHtmlEntities(loc[1]).replace(/\s+/g, " ").trim() || null : null
    })
    const description = safe(() => extractDescription(html))

    const detail: JobDetail = {
      id: target.slug,
      title,
      company,
      location,
      date: datePosted,
      salary: formatSalary(min ? parseInt(min, 10) : null, max ? parseInt(max, 10) : null),
      employment_type: employment,
      url: `${SITE_BASE}/jobs/${target.slug}`,
      description,
    }

    if (opts.format === "plain") {
      const lines = [
        detail.title ?? "(untitled)",
        `${detail.company ?? "—"} · ${detail.location ?? "—"}`,
        detail.date ? `Posted: ${detail.date.slice(0, 10)}` : "",
        detail.employment_type ? `Employment: ${detail.employment_type}` : "",
        detail.salary ? `Salary: ${detail.salary}` : "",
        "",
        detail.description ?? "(no description)",
        "",
        `URL: ${detail.url}`,
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
