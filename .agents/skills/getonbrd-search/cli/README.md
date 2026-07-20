# getonbrd-cli

A tiny, self-contained CLI that searches **[Get on Board](https://www.getonbrd.com)**
(getonbrd.com) — a Latin-American tech job board — via its public JSON API, and
fetches a single posting's full detail. Postings are in **Spanish and English**.

- **Zero runtime dependencies.** Plain `bun` + `fetch` + regex. `bun install` only
  pulls dev types (`typescript`, `bun-types`) for the typecheck.
- **No authentication.** Reads are public; a browser User-Agent is sent and
  Cloudflare rate-limiting is handled with exponential backoff + jitter.

> ⚠️ **Personal, low-volume use only.** See `../SKILL.md` for the full terms note.

## Install

```bash
bun install   # dev types only — nothing is required at runtime
```

## Usage

```bash
# Search (‑‑query is required)
bun run src/cli.ts search -q "Engineering Manager" --limit 5 --format table
bun run src/cli.ts search -q "Desarrollador remoto" --jobage 14 --format json
bun run src/cli.ts search -q "Agile Coach" -l "Santiago" --format plain

# Detail (pass a search result's id, or a full getonbrd.com/jobs/... URL)
bun run src/cli.ts detail <id> --format plain
```

Flags: `--query/-q` (required), `--location/-l` (folded into the query — the API
has no location param), `--jobage <days>` (client-side filter on the posting date),
`--page <n>`, `--limit <n>`, `--format json|table|plain`.

## Output

Search JSON is `{ "meta": { "count", "page" }, "results": [...] }`; each result
carries at least `id`, `title`, `company`, `location`, `date` (ISO 8601), `url`,
plus `remote`, `salary`, and `snippet`. Missing values are `null`. Errors go to
**stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Scripts

- `bun run start` — run the CLI
- `bun run test` — live smoke tests (`bun test --timeout 30000`)
- `bun run typecheck` — `tsc --noEmit`

See `../url-reference.md` for the API endpoints, safe vs forbidden params, and quirks.
