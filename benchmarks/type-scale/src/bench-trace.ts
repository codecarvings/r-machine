/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

/**
 * Type-trace hotspots: emits a tsc `--generateTrace` for a generated project and
 * runs `@typescript/analyze-trace` over it to surface the most expensive types /
 * check operations. Confirms WHICH generics dominate as N grows (expected: the
 * Surface/SurfaceMap, ResolveLayoutType, FilterResAtlasKeys and Map/ListPlugin
 * machinery). Costly, so the orchestrator only runs it for the larger N.
 */
import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { projectDir } from "./config.js";
import { generateProject } from "./generate.js";

const require = createRequire(import.meta.url);

function tscPath(): string {
  return resolve(require.resolve("typescript/package.json"), "..", "bin", "tsc");
}

function analyzeTraceBin(): string {
  const pkg = require.resolve("@typescript/analyze-trace/package.json");
  return resolve(pkg, "..", "bin", "analyze-trace");
}

export interface TraceResult {
  n: number;
  /** Hot-spot report from analyze-trace (plain text; `--color false`). */
  report: string;
}

export function benchTrace(n: number, ensureGenerated = true): TraceResult {
  const dir = projectDir(n);
  const compileTsconfig = resolve(dir, "tsconfig.compile.json");
  if (ensureGenerated && !existsSync(compileTsconfig)) generateProject(n);

  const traceDir = resolve(dir, ".trace");
  rmSync(traceDir, { recursive: true, force: true });

  // Emit trace.json + types.json. tsc may exit non-zero on type errors; the
  // trace is still written, so we ignore the exit status here.
  try {
    execFileSync(process.execPath, [tscPath(), "-p", compileTsconfig, "--noEmit", "--generateTrace", traceDir], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "ignore", "ignore"],
    });
  } catch {
    /* trace still emitted */
  }

  let report: string;
  try {
    // Lower the thresholds well below the defaults (skip 100 / force 500): these
    // checks are fast, so we still want the relatively-hottest spots reported.
    report = execFileSync(
      process.execPath,
      [analyzeTraceBin(), traceDir, "--skipMillis", "10", "--forceMillis", "25", "--color", "false"],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }
    );
  } catch (err) {
    // analyze-trace exits non-zero when it finds hot spots — that output is what
    // we want, so capture stdout from the error.
    const e = err as { stdout?: string; stderr?: string };
    report = (e.stdout ?? "") || (e.stderr ?? "");
  }

  return { n, report: report.trim() || "(no hot spots above threshold)" };
}

// ─── CLI ────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf("--n");
  const n = i >= 0 ? Number.parseInt(process.argv[i + 1]!, 10) : 100;
  console.log(benchTrace(n).report);
}
