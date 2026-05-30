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
 * Orchestrator: for each scale point, (re)generates the project and measures
 * compile cost + live IntelliSense latency; for the larger points it also runs
 * the type-trace analysis. Writes results/results.json (committed history) and a
 * human-readable results/REPORT.md.
 *
 * Run: `pnpm run-all` (or `pnpm bench:types` from the repo root).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { benchCompile, type CompileMetrics } from "./bench-compile.js";
import { benchIntelliSense, type IntelliSenseMetrics } from "./bench-intellisense.js";
import { benchTrace, type TraceResult } from "./bench-trace.js";
import { RESULTS_ROOT, SCALE_POINTS, TRACE_POINTS } from "./config.js";
import { generateProject } from "./generate.js";

const PROBE_ORDER = ["deps_list", "deps_map", "token", "surface", "plug", "hover"] as const;

interface PointResult {
  n: number;
  compile: CompileMetrics | { error: string };
  intellisense: IntelliSenseMetrics | { error: string };
}

interface Results {
  generatedAt: string;
  seedNote: string;
  scalePoints: number[];
  points: PointResult[];
  traces: TraceResult[];
}

// ─── Markdown report ────────────────────────────────────────────────────────

function table(headers: string[], rows: (string | number)[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return `${head}\n${sep}\n${body}`;
}

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "—";
}

function compileTable(points: PointResult[]): string {
  const rows = points.map((p) => {
    if ("error" in p.compile) return [p.n, "ERROR", "—", "—", "—", "—", "—", "—"];
    const c = p.compile;
    return [
      c.n,
      fmt(c.types),
      fmt(c.instantiations),
      fmt(c.instantiationsPerResource),
      c.checkTimeS,
      c.totalTimeS,
      Math.round(c.memoryKB / 1024),
      c.errors > 0 ? `⚠️ ${c.errors}` : "0",
    ];
  });
  return table(["N", "Types", "Instantiations", "Inst/resource", "Check (s)", "Total (s)", "Mem (MB)", "Errors"], rows);
}

function isTable(points: PointResult[], stat: "p50" | "p95"): string {
  const rows = points.map((p) => {
    if ("error" in p.intellisense) return [p.n, "ERROR", ...PROBE_ORDER.map(() => "—")];
    const m = p.intellisense;
    return [p.n, m.projectLoadMs, ...PROBE_ORDER.map((k) => m.probes[k]?.[stat] ?? "—")];
  });
  return table(["N", "Project load (ms)", ...PROBE_ORDER], rows);
}

function growthNote(points: PointResult[]): string {
  const ok = points.filter((p) => !("error" in p.compile) && !("error" in p.intellisense));
  if (ok.length < 2) return "_Not enough successful points to compute growth._";
  const first = ok[0]!;
  const last = ok[ok.length - 1]!;
  const c0 = first.compile as CompileMetrics;
  const c1 = last.compile as CompileMetrics;
  const i0 = first.intellisense as IntelliSenseMetrics;
  const i1 = last.intellisense as IntelliSenseMetrics;
  const nFactor = c1.n / c0.n;
  const instFactor = c1.instantiations / c0.instantiations;
  const plug0 = i0.probes.plug?.p95 ?? Number.NaN;
  const plug1 = i1.probes.plug?.p95 ?? Number.NaN;
  const plugFactor = plug1 / plug0;
  const superLinear = instFactor / nFactor;
  return [
    `From N=${c0.n} to N=${c1.n} (a **${nFactor.toFixed(0)}×** resource increase):`,
    "",
    `- **Instantiations** grew **${instFactor.toFixed(1)}×** (${fmt(c0.instantiations)} → ${fmt(c1.instantiations)}). ` +
      `Per-resource instantiations went ${fmt(c0.instantiationsPerResource)} → ${fmt(c1.instantiationsPerResource)} ` +
      `(${superLinear >= 1.15 ? `**super-linear ×${superLinear.toFixed(2)}** — degrades with scale` : superLinear <= 0.9 ? `sub-linear ×${superLinear.toFixed(2)} — amortizes well` : "roughly linear"}).`,
    `- **Check time** ${c0.checkTimeS}s → ${c1.checkTimeS}s.`,
    `- **Consumer Plug completion p95** (\`Plug("|")\`) ${plug0.toFixed(1)}ms → ${plug1.toFixed(1)}ms (**${plugFactor.toFixed(1)}×**) — the IntelliSense path a developer feels most.`,
  ].join("\n");
}

function renderReport(r: Results): string {
  const traceBlocks = r.traces.map((t) => `### N=${t.n}\n\n\`\`\`\n${t.report}\n\`\`\``).join("\n\n");
  return `# R-Machine — Type-System Scalability Report

_Generated ${r.generatedAt}. ${r.seedNote}_

This report measures how R-Machine's TypeScript generics behave as the number of
**resources** (OuterGear / BaseGear / Shell) grows from ${r.scalePoints[0]} to
${r.scalePoints[r.scalePoints.length - 1]}. Projects are synthetic but realistic:
~50% OuterGear / 20% BaseGear / 30% Shell, acyclic dependencies in a mix of
list/map modes with string and token references. Numbers are machine-specific —
read the **trends**, not the absolutes.

## 1. Compile cost (\`tsc --extendedDiagnostics\`)

${compileTable(r.points)}

> \`Inst/resource\` is the key non-linearity signal: flat ⇒ scales linearly,
> rising ⇒ the type system does super-linear work per added resource.

## 2. IntelliSense latency (live \`tsserver\`)

Each cell is the warm per-keystroke recompute latency (cache busted every sample)
at a realistic cursor position. \`deps_*\` = atlas-key completion inside
\`withDeps()\`; \`token\` = \`token("|")\`; \`surface\` = member access on a dependency;
\`plug\` = consumer \`Plug("|")\` completion; \`hover\` = quickinfo.

**p50 (ms)**

${isTable(r.points, "p50")}

**p95 (ms)**

${isTable(r.points, "p95")}

## 3. Type-trace hot spots (\`@typescript/analyze-trace\`)

${traceBlocks || "_No traces captured._"}

## 4. Observations

${growthNote(r.points)}
`;
}

// ─── Entrypoint ─────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(RESULTS_ROOT, { recursive: true });
  const points: PointResult[] = [];
  const traces: TraceResult[] = [];

  for (const n of SCALE_POINTS) {
    console.log(`\n=== N=${n} ===`);
    generateProject(n);

    let compile: PointResult["compile"];
    try {
      console.log("  compile…");
      compile = benchCompile(n, false);
      const c = compile as CompileMetrics;
      console.log(`    types=${fmt(c.types)} inst=${fmt(c.instantiations)} check=${c.checkTimeS}s errors=${c.errors}`);
      if (c.errors > 0)
        console.log(`    ⚠️  ${c.errors} TYPE ERROR(S) — the generated project is invalid; fix the generator.`);
    } catch (e) {
      compile = { error: String((e as Error).message).slice(0, 500) };
      console.log(`    compile FAILED: ${(compile as { error: string }).error.split("\n")[0]}`);
    }

    let intellisense: PointResult["intellisense"];
    try {
      console.log("  intellisense (tsserver)…");
      intellisense = await benchIntelliSense(n, false);
      const m = intellisense as IntelliSenseMetrics;
      console.log(`    load=${m.projectLoadMs}ms plug.p95=${m.probes.plug?.p95}ms`);
    } catch (e) {
      intellisense = { error: String((e as Error).message).slice(0, 500) };
      console.log(`    intellisense FAILED: ${(intellisense as { error: string }).error.split("\n")[0]}`);
    }

    points.push({ n, compile, intellisense });
  }

  for (const n of TRACE_POINTS) {
    console.log(`\n=== trace N=${n} ===`);
    try {
      traces.push(benchTrace(n, false));
      console.log("    done");
    } catch (e) {
      traces.push({ n, report: `(trace failed: ${(e as Error).message})` });
    }
  }

  const results: Results = {
    generatedAt: new Date().toISOString(),
    seedNote: "Deterministic: same seed+N => identical project. Re-run `pnpm run-all` to reproduce.",
    scalePoints: [...SCALE_POINTS],
    points,
    traces,
  };

  writeFileSync(resolve(RESULTS_ROOT, "results.json"), `${JSON.stringify(results, null, 2)}\n`);
  writeFileSync(resolve(RESULTS_ROOT, "REPORT.md"), renderReport(results));
  console.log(`\nWrote results/results.json and results/REPORT.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
