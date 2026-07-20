#!/usr/bin/env bun
// Self-contained CLI for searching Get on Board (getonbrd.com), a LATAM tech job
// board, via its public JSON API. No external CLI framework and zero runtime
// dependencies — it runs anywhere `bun` is available with nothing installed
// beyond the repo clone.
//
// Reads are public (no API key), but the site sits behind Cloudflare, which
// rate-limits aggressively; the fetch layer (helpers.ts) applies exponential
// backoff with jitter. Keep request volume LOW.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { writeError } from "./helpers.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

// Short-flag aliases.
const ALIAS: Record<string, string> = { q: "query", l: "location" }

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith("-")) {
      ;(flags._ as string[]).push(a)
      continue
    }
    const name = a.replace(/^-+/, "")
    const key = ALIAS[name] ?? name
    const next = argv[i + 1]
    let value: string | boolean = true
    if (next !== undefined && !next.startsWith("-")) {
      value = next
      i++
    }
    flags[key] = value
  }
  return flags
}

const KNOWN_SEARCH_FLAGS = new Set(["query", "jobage", "page", "limit", "location", "format"])

const HELP = `getonbrd-cli — search Get on Board (getonbrd.com), a LATAM tech job board

USAGE
  bun run src/cli.ts search --query "<keywords>" [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (REQUIRED). Full-text search.
  --location, -l <text>   Location hint. Get on Board has NO location param on the
                          search API, so this is FOLDED INTO the query string.
  --jobage <days>         Keep only jobs published within N days (CLIENT-SIDE filter
                          on published_at; the API has no server-side date filter).
  --page <n>              1-indexed page, maps to the API 'page' param. Default 1.
  --limit <n>             Client-side cap on returned results. Default 20.
  --format <fmt>          json (default) | table | plain.

DETAIL
  <id|url>                A Get on Board job slug (a search result's 'id') or a full
                          https://www.getonbrd.com/jobs/... URL. Fetched from the
                          public HTML page (the JSON detail endpoint needs a key).
  --format <fmt>          json (default) | plain.

EXAMPLES
  bun run src/cli.ts search -q "Engineering Manager" --limit 5 --format table
  bun run src/cli.ts search -q "Desarrollador remoto" --jobage 14 --format table
  bun run src/cli.ts search -q "Agile Coach" -l "Santiago" --format plain
  bun run src/cli.ts detail engineering-manager-acme-santiago --format plain

Reads are public (no API key). Source: getonbrd.com. Personal, low-volume use only.
`

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "search") {
    // Reject unknown flags so typos fail loudly rather than being silently ignored.
    for (const key of Object.keys(flags)) {
      if (key === "_") continue
      if (!KNOWN_SEARCH_FLAGS.has(key)) {
        writeError(`unknown flag --${key}`, "BAD_ARG")
        return 1
      }
    }

    const query = typeof flags.query === "string" ? flags.query.trim() : ""
    if (!query) {
      writeError("search requires --query/-q", "NO_QUERY")
      return 1
    }

    for (const name of ["jobage", "page", "limit"] as const) {
      if (flags[name] !== undefined && flags[name] !== true) {
        const v = parseInt(flags[name] as string, 10)
        if (isNaN(v)) {
          writeError(`--${name} must be a number, got "${String(flags[name])}"`, "BAD_ARG")
          return 1
        }
      } else if (flags[name] === true) {
        writeError(`--${name} requires a value`, "BAD_ARG")
        return 1
      }
    }

    const fmt = (flags.format as string) || "json"
    const opts: SearchOpts = {
      query,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage: flags.jobage ? Math.max(1, parseInt(flags.jobage as string, 10)) : undefined,
      page: flags.page ? Math.max(1, parseInt(flags.page as string, 10)) : 1,
      limit: flags.limit ? Math.max(1, parseInt(flags.limit as string, 10)) : 20,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      writeError("detail requires a <id|url>", "NO_ID")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = { id, format: fmt === "plain" ? "plain" : "json" }
    return runDetail(opts)
  }

  writeError(`Unknown command "${cmd}"`, "BAD_CMD")
  return 1
}

main().then((code) => process.exit(code))
