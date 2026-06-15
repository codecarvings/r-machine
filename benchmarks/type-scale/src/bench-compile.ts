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
 * Compile-cost measurement: runs `tsc --noEmit --extendedDiagnostics` against a
 * generated project and parses the headline metrics. The numbers that reveal
 * non-linear type-system blowup are Types, Instantiations and Check time.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { projectDir } from "./config.js";
import { generateProject } from "./generate.js";

const require = createRequire(import.meta.url);

export interface CompileMetrics {
  n: number;
  files: number;
  types: number;
  instantiations: number;
  memoryKB: number;
  checkTimeS: number;
  totalTimeS: number;
  /** Instantiations normalised per resource — the headline non-linearity signal. */
  instantiationsPerResource: number;
  /** Type errors reported. Must be 0 — a non-zero value means the generator emitted invalid code. */
  errors: number;
}

/** Path to the tsc entrypoint resolved from this package's TypeScript dep. */
function tscPath(): string {
  return resolve(require.resolve("typescript/package.json"), "..", "bin", "tsc");
}

function num(out: string, label: string): number {
  // extendedDiagnostics lines look like "Instantiations:    123456" or
  // "Check time:        1.23s" / "Memory used:       456789K".
  const m = out.match(new RegExp(`${label}:\\s*([0-9.]+)`));
  return m ? Number.parseFloat(m[1]!) : Number.NaN;
}

export function benchCompile(n: number, ensureGenerated = true): CompileMetrics {
  const dir = projectDir(n);
  const compileTsconfig = resolve(dir, "tsconfig.compile.json");
  if (ensureGenerated && !existsSync(compileTsconfig)) {
    generateProject(n);
  }

  let out: string;
  try {
    out = execFileSync(process.execPath, [tscPath(), "-p", compileTsconfig, "--noEmit", "--extendedDiagnostics"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    // tsc exits non-zero when the project has type errors, but still prints the
    // diagnostics block to stdout — which is what we want to parse. We only
    // treat a *missing* diagnostics block as a hard failure (e.g. OOM crash).
    const e = err as { stdout?: string; stderr?: string };
    out = (e.stdout ?? "") + (e.stderr ?? "");
    if (!/Instantiations:/.test(out)) {
      throw new Error(`tsc produced no diagnostics for N=${n} (possible OOM/crash):\n${out.slice(-2000)}`);
    }
  }

  const types = num(out, "Types");
  const instantiations = num(out, "Instantiations");
  // tsc prints a "Found N error(s)" summary; fall back to counting "error TSxxxx".
  const summary = out.match(/Found (\d+) error/);
  const errors = summary ? Number.parseInt(summary[1]!, 10) : (out.match(/error TS\d+/g)?.length ?? 0);
  return {
    n,
    files: num(out, "Files"),
    types,
    instantiations,
    memoryKB: num(out, "Memory used"),
    checkTimeS: num(out, "Check time"),
    totalTimeS: num(out, "Total time"),
    instantiationsPerResource: Math.round(instantiations / n),
    errors,
  };
}

// ─── CLI ────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf("--n");
  const n = i >= 0 ? Number.parseInt(process.argv[i + 1]!, 10) : 25;
  console.log(JSON.stringify(benchCompile(n), null, 2));
}
