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
 * Live IntelliSense latency: drives a real `tsserver` (the same process that
 * powers the editor) and times completion + quickinfo requests at realistic
 * cursor positions inside the generated fixture. This measures what a developer
 * actually feels while typing as the resource count grows.
 *
 * Probes (see templates.renderFixture):
 *   deps_list  — atlas-key completion inside `withDeps("|")`  (ListPlugin path)
 *   deps_map   — atlas-key completion inside `withDeps({ a: "|" })` (MapPlugin path)
 *   token      — namespace-key completion inside `token("|")`
 *   surface    — member completion on a dependency surface `d.|`
 *   plug       — public-surface completion inside `Plug("|")` (consumer)
 *   hover      — quickinfo over a consumer plug value
 */
import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { IS_SAMPLES, IS_WARMUP, projectDir } from "./config.js";
import { generateProject } from "./generate.js";

const require = createRequire(import.meta.url);

interface Probe {
  key: string;
  marker: string;
  kind: "completionInfo" | "quickinfo";
  offset: (line: string) => number;
}

/** 1-based column just inside the first double-quote of `anchor`. */
function afterQuote(anchor: string) {
  return (line: string) => {
    const i = line.indexOf(anchor);
    if (i < 0) {
      throw new Error(`anchor not found: ${anchor}`);
    }
    return i + anchor.length + 1;
  };
}

const PROBES: Probe[] = [
  { key: "deps_list", marker: "MARK_DEPS_LIST", kind: "completionInfo", offset: afterQuote('withDeps("') },
  { key: "deps_map", marker: "MARK_DEPS_MAP", kind: "completionInfo", offset: afterQuote('a: "') },
  { key: "token", marker: "MARK_TOKEN", kind: "completionInfo", offset: afterQuote('token("') },
  {
    key: "surface",
    marker: "MARK_SURFACE",
    kind: "completionInfo",
    offset: (line) => line.indexOf("d.peek") + 3, // just after `d.`
  },
  { key: "plug", marker: "MARK_PLUG", kind: "completionInfo", offset: afterQuote('Plug("') },
  {
    key: "hover",
    marker: "MARK_HOVER",
    kind: "quickinfo",
    offset: (line) => line.indexOf("probePlug;") + 3, // inside the identifier
  },
];

export interface ProbeResult {
  entryCount: number; // completion candidates (or -1 for quickinfo)
  p50: number;
  p95: number;
}

export interface IntelliSenseMetrics {
  n: number;
  projectLoadMs: number;
  probes: Record<string, ProbeResult>;
}

class TsServer {
  private proc: ChildProcessWithoutNullStreams;
  private seq = 0;
  private buf = "";
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();

  constructor() {
    const tsserver = require.resolve("typescript/lib/tsserver.js");
    this.proc = spawn(process.execPath, [tsserver, "--disableAutomaticTypingAcquisition"], {
      stdio: ["pipe", "pipe", "pipe"],
    }) as ChildProcessWithoutNullStreams;
    this.proc.stdout.setEncoding("utf8");
    this.proc.stdout.on("data", (chunk: string) => this.onData(chunk));
  }

  private onData(chunk: string) {
    this.buf += chunk;
    let nl = this.buf.indexOf("\n");
    while (nl >= 0) {
      const line = this.buf.slice(0, nl).trim();
      this.buf = this.buf.slice(nl + 1);
      nl = this.buf.indexOf("\n");
      if (!line.startsWith("{")) {
        continue; // skip Content-Length headers / blank lines
      }
      let msg: any;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }
      if (msg.type === "response" && typeof msg.request_seq === "number") {
        const p = this.pending.get(msg.request_seq);
        if (p) {
          this.pending.delete(msg.request_seq);
          p.resolve(msg);
        }
      }
    }
  }

  /**
   * Zero-width insertion at the start of `line` — bumps the file version (busting
   * tsserver's completion cache) without a deletion. A full-line replace with a
   * large endOffset corrupts the buffer on a short last line, so we only insert.
   */
  bumpVersion(file: string, line: number): void {
    this.notify("change", { file, line, offset: 1, endLine: line, endOffset: 1, insertString: "/*v*/" });
  }

  /** Fire-and-forget notification (e.g. `open`). */
  notify(command: string, args: unknown): void {
    this.seq++;
    this.proc.stdin.write(`${JSON.stringify({ seq: this.seq, type: "request", command, arguments: args })}\n`);
  }

  /** Request/response with round-trip timing in ms. */
  request(
    command: string,
    args: unknown,
    timeoutMs = 60_000
  ): Promise<{ elapsedMs: number; body: any; success: boolean }> {
    this.seq++;
    const seq = this.seq;
    const t0 = performance.now();
    const payload = `${JSON.stringify({ seq, type: "request", command, arguments: args })}\n`;
    return new Promise((resolveP, rejectP) => {
      const timer = setTimeout(() => {
        this.pending.delete(seq);
        rejectP(new Error(`tsserver request '${command}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.pending.set(seq, {
        resolve: (msg) => {
          clearTimeout(timer);
          resolveP({ elapsedMs: performance.now() - t0, body: msg.body, success: msg.success !== false });
        },
        reject: rejectP,
      });
      this.proc.stdin.write(payload);
    });
  }

  dispose(): void {
    try {
      this.notify("exit", {});
    } catch {
      /* ignore */
    }
    this.proc.kill();
  }
}

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return Number.NaN;
  }
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx]! * 10) / 10;
}

export async function benchIntelliSense(n: number, ensureGenerated = true): Promise<IntelliSenseMetrics> {
  const dir = projectDir(n);
  if (ensureGenerated && !existsSync(resolve(dir, "tsconfig.json"))) {
    generateProject(n);
  }

  const fixture = resolve(dir, "src", "_fixture.tsx");
  const content = readFileSync(fixture, "utf8");
  const lines = content.split("\n");

  const locate = (marker: string, offsetFn: (line: string) => number) => {
    const idx = lines.findIndex((l) => l.includes(marker));
    if (idx < 0) {
      throw new Error(`marker ${marker} not found in fixture`);
    }
    return { line: idx + 1, offset: offsetFn(lines[idx]!) };
  };

  const scratchLine = lines.findIndex((l) => l.includes("//SCRATCH")) + 1;
  if (scratchLine === 0) {
    throw new Error("scratch line not found in fixture");
  }

  const server = new TsServer();
  try {
    server.notify("open", { file: fixture, fileContent: content, scriptKindName: "TSX" });

    let projectLoadMs = Number.NaN;
    const probes: Record<string, ProbeResult> = {};

    for (const probe of PROBES) {
      const { line, offset } = locate(probe.marker, probe.offset);
      const samples: number[] = [];
      let entryCount = -1;

      for (let i = 0; i < IS_SAMPLES; i++) {
        // Bump the file version so tsserver must recompute (no completion-cache
        // hit) — this models the cost of a real keystroke.
        server.bumpVersion(fixture, scratchLine);
        const res = await server.request(probe.kind, {
          file: fixture,
          line,
          offset,
          ...(probe.kind === "completionInfo" ? { triggerKind: 1 } : {}),
        });
        if (Number.isNaN(projectLoadMs)) {
          projectLoadMs = Math.round(res.elapsedMs); // first request = cold (incl. project load)
        }
        if (probe.kind === "completionInfo" && res.body?.entries) {
          entryCount = res.body.entries.length;
        }
        samples.push(res.elapsedMs);
      }

      const warm = samples.slice(IS_WARMUP).sort((a, b) => a - b);
      probes[probe.key] = { entryCount, p50: pct(warm, 50), p95: pct(warm, 95) };
    }

    return { n, projectLoadMs, probes };
  } finally {
    server.dispose();
  }
}

// ─── CLI ────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const i = process.argv.indexOf("--n");
  const n = i >= 0 ? Number.parseInt(process.argv[i + 1]!, 10) : 25;
  benchIntelliSense(n)
    .then((m) => console.log(JSON.stringify(m, null, 2)))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
