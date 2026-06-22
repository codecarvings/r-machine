#!/usr/bin/env node

/**
 * Pins every examples/* package.json's R-Machine dependency ranges to the
 * current package version (read from packages/r-machine/package.json — kept in
 * lockstep with the other r-machine packages by changeset `linked`).
 *
 * The examples declare real version ranges (not `workspace:*`) so they stay
 * installable as standalone projects once copied out of the monorepo. The
 * trade-off is that those ranges would otherwise drift as alphas bump; running
 * this from `version-packages` keeps them pinned to the version each release
 * was built against — no hand-editing.
 *
 * Invoked from the root `version-packages` script (after `changeset version`),
 * which the release workflow runs via the changesets/action `version:` input.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const examplesDir = resolve(repoRoot, "examples");

const { version } = JSON.parse(readFileSync(resolve(repoRoot, "packages", "r-machine", "package.json"), "utf-8")) as {
  version: string;
};
const range = `^${version}`;

const isRMachineDep = (name: string) => name === "r-machine" || name.startsWith("@r-machine/");

let touched = 0;
for (const entry of readdirSync(examplesDir)) {
  const pkgPath = join(examplesDir, entry, "package.json");
  let raw: string;
  try {
    raw = readFileSync(pkgPath, "utf-8");
  } catch {
    continue; // directory without a package.json — skip
  }

  const pkg = JSON.parse(raw) as Record<string, Record<string, string> | undefined>;
  let changed = false;
  for (const field of ["dependencies", "devDependencies"] as const) {
    const deps = pkg[field];
    if (!deps) {
      continue;
    }
    for (const name of Object.keys(deps)) {
      if (isRMachineDep(name) && deps[name] !== range) {
        deps[name] = range;
        changed = true;
      }
    }
  }

  if (changed) {
    writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
    touched++;
    console.log(`  ${entry} → ${range}`);
  }
}

console.log(`sync-example-deps: pinned R-Machine deps to ${range} (${touched} example(s) updated).`);
