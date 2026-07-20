import { describe, expect, test } from "bun:test"
import { join } from "path"

const CLI_PATH = join(import.meta.dir, "../src/cli.ts")

interface CLIResult {
  stdout: string
  stderr: string
  exitCode: number
}

/** Spawn the CLI in a child process and capture stdout/stderr/exit. */
async function runCLI(args: string[]): Promise<CLIResult> {
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env },
  })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode }
}

function parseJSON<T = unknown>(text: string): T {
  return JSON.parse(text) as T
}

interface SearchOutput {
  meta: { count: number; page: number }
  results: Array<{ id: string; title: string; url: string; company: string | null }>
}

describe("getonbrd CLI (live smoke tests — low volume)", () => {
  test("search returns a non-empty results array with populated fields", async () => {
    const res = await runCLI(["search", "-q", "Engineering Manager", "--limit", "3", "--format", "json"])
    expect(res.exitCode).toBe(0)
    const out = parseJSON<SearchOutput>(res.stdout)
    expect(Array.isArray(out.results)).toBe(true)
    expect(out.results.length).toBeGreaterThan(0)
    const first = out.results[0]
    expect(first.id).toBeTruthy()
    expect(first.title).toBeTruthy()
    expect(first.url).toBeTruthy()
  })

  test("missing required --query exits 1 with a JSON {error,code} on STDERR", async () => {
    const res = await runCLI(["search"])
    expect(res.exitCode).toBe(1)
    expect(res.stdout).toBe("")
    const err = parseJSON<{ error: string; code: string }>(res.stderr)
    expect(err.code).toBe("NO_QUERY")
    expect(typeof err.error).toBe("string")
  })

  test("a bogus flag exits 1 with a JSON {error,code} on STDERR", async () => {
    const res = await runCLI(["search", "-q", "developer", "--bogus", "x"])
    expect(res.exitCode).toBe(1)
    expect(res.stdout).toBe("")
    const err = parseJSON<{ error: string; code: string }>(res.stderr)
    expect(err.code).toBe("BAD_ARG")
  })
})
