#!/usr/bin/env node

/**
 * Verifies the SPDX licence headers.
 *
 * Two checks, both described in CONTRIBUTING.md § Licence headers:
 *
 *  1. Every file under `packages/<pkg>/src/` (and the type-scale benchmark)
 *     opens with the canonical four-line block, byte for byte — an optional
 *     shebang line may precede it. Exactness is the point: it is what makes
 *     "identical in every file" true, and what turns an added personal
 *     copyright line into a failure rather than a silent divergence.
 *
 *  2. Nowhere in the repository does a copyright line say anything other
 *     than the collective notice. This is the check that matters in practice —
 *     the realistic case is not a new file missing its header, it is a
 *     contributor adding their own notice, quite possibly in a test or an
 *     example, i.e. outside the scope of check 1.
 *
 * `--write` inserts a MISSING header. A header that is present but WRONG is
 * always a hard failure: auto-rewriting it would silently delete a
 * contributor's copyright line, and that has to be a conversation, not a sed.
 *
 * The file set comes from `git ls-files`, tracked plus untracked-not-ignored:
 * a walk of the tree would sweep build output, which `zshy` emits *into the
 * package root* (`packages/r-machine/core/*.js`) rather than a `dist/` of its
 * own, and which carries a stale copy of whatever header it was built from.
 * The "untracked" half matters too — a brand-new file must be fixable before
 * it is first staged, not after CI rejects it.
 *
 * Run from the root `check` / `check:dry` scripts, so CI's existing "Run Check"
 * step gates it and no new habit is needed locally.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HEADER = `/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */
`;

// Derived, never re-typed: a second literal copy of the notice in this file
// would itself trip check 2.
const COPYRIGHT_LINE = HEADER.split("\n")[1].replace(/^ \* /, "");

// The bare marker — "Copyright" plus the "(c)" — sliced out rather than
// spelled: writing it here would make this file trip its own check 2.
const MARKER = COPYRIGHT_LINE.slice(0, COPYRIGHT_LINE.indexOf(")") + 1);

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");

/** Paths that must carry the header. */
const HEADER_SCOPE = /^(packages\/[^/]+|benchmarks\/type-scale)\/src\/.+\.tsx?$/;

/** Extensions swept by check 2. Text formats only; anything else is skipped. */
const TEXT_EXT = /\.(m?tsx?|cts|m?jsx?|cjs|jsonc?|md|txt|ya?ml|css|html|svg|sh)$/;

/**
 * Files exempt from check 2, with the reason. Keep this list at zero entries
 * wherever possible — an exemption is a blind spot for the whole file.
 */
const SWEEP_EXEMPT = new Map([
  [
    "packages/r-machine-next/tests/dev/create-next-dev-import.test.ts",
    "synthetic module fixture: an escaped header inside a string literal",
  ],
]);

const files = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
  cwd: repoRoot,
  encoding: "utf-8",
  maxBuffer: 64 * 1024 * 1024,
})
  .split("\0")
  .filter(Boolean);

const missing: string[] = [];
const wrong: { file: string; line: number; text: string }[] = [];
const stray: { file: string; line: number; text: string }[] = [];
let inserted = 0;
let checked = 0;

for (const file of files) {
  const inScope = HEADER_SCOPE.test(file);
  if (!inScope && (!TEXT_EXT.test(file) || SWEEP_EXEMPT.has(file))) {
    continue;
  }

  const abs = join(repoRoot, file);
  let source: string;
  try {
    source = readFileSync(abs, "utf-8");
  } catch {
    continue; // listed but unreadable — a broken symlink, or deleted mid-run
  }

  // -- Check 1 ------------------------------------------------------------
  if (inScope) {
    checked++;
    const shebangEnd = source.startsWith("#!") ? source.indexOf("\n") + 1 : 0;
    const body = source.slice(shebangEnd);

    if (!body.startsWith(HEADER)) {
      // Present but divergent, or absent altogether? Only the second is fixable.
      const opening = body.split("\n", 6);
      const claim = opening.findIndex((l) => l.includes("Copyright") || l.includes("SPDX-License-Identifier"));

      if (claim !== -1) {
        wrong.push({ file, line: (shebangEnd ? 1 : 0) + claim + 1, text: opening[claim] });
        continue; // already reported; check 2 would only say the same thing twice
      }
      if (write) {
        // Siblings keep a blank line between the header and the first statement.
        const gap = body.startsWith("\n") ? "" : "\n";
        source = source.slice(0, shebangEnd) + HEADER + gap + body;
        writeFileSync(abs, source);
        inserted++;
      } else {
        missing.push(file);
      }
    }
  }

  // -- Check 2 ------------------------------------------------------------
  if (SWEEP_EXEMPT.has(file) || !source.includes(MARKER)) {
    continue;
  }

  source.split("\n").forEach((line, i) => {
    if (!line.includes(MARKER)) {
      return;
    }
    // Strip the comment syntax the notice happens to be wrapped in, so one rule
    // covers a `*` header, a `//` line, and a bare docs colophon alike.
    const notice = line
      .trim()
      .replace(/^(\/\*\*?|\/\/|\*|#|<!--)\s*/, "")
      .replace(/\s*(\*\/|-->)$/, "")
      .trim();
    if (notice !== COPYRIGHT_LINE) {
      stray.push({ file, line: i + 1, text: line.trim() });
    }
  });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const label = "check-license-headers";

if (inserted > 0) {
  console.log(`${label}: inserted the licence header into ${inserted} file(s).`);
}

if (missing.length === 0 && wrong.length === 0 && stray.length === 0) {
  console.log(`${label}: ${checked} header(s) checked, every copyright notice is the collective one.`);
  process.exit(0);
}

if (missing.length > 0) {
  console.error(`\n${label}: missing licence header — run \`pnpm check\` to insert it:`);
  for (const file of missing) {
    console.error(`  ${file}`);
  }
}

if (wrong.length > 0) {
  console.error(`\n${label}: non-standard licence header — fix by hand:`);
  for (const { file, line, text } of wrong) {
    console.error(`  ${file}:${line}\n      ${text.trim()}`);
  }
}

if (stray.length > 0) {
  console.error(`\n${label}: copyright notice that is not the collective one:`);
  for (const { file, line, text } of stray) {
    console.error(`  ${file}:${line}\n      ${text}`);
  }
}

console.error(`\nThe notice must read exactly:  ${COPYRIGHT_LINE}`);
console.error("See CONTRIBUTING.md § Licence headers for why, including what to do with third-party material.\n");
process.exit(1);
