#!/usr/bin/env node

/**
 * Updates npm dist-tags for published packages when in prerelease mode.
 *
 * This script reads the changeset prerelease configuration and applies the
 * appropriate dist-tag to packages that were just published. This ensures
 * that prerelease versions (e.g., alpha, beta) are tagged correctly on npm.
 *
 * It also moves `latest`. That is not cosmetic: `changeset publish` only
 * publishes a prerelease to `latest` while *every* version already on the
 * registry carries the current pre tag (its `only-pre` branch). The moment a
 * second pre tag exists — the alpha→beta switch — that branch stops matching
 * and `latest` would freeze on the last alpha forever, so a bare
 * `npm install r-machine` (and every install snippet in the READMEs, the
 * bundled Skill and `docs/`, plus `npx rforge@latest`) would keep serving the
 * superseded alpha. Moving `latest` here preserves the behaviour those
 * snippets already rely on.
 *
 * The move is guarded: `latest` is never walked backwards to an older version
 * than the one it currently points at.
 *
 * Usage:
 *   tsx scripts/update-npm-dist-tags.ts '{"name":"pkg","version":"1.0.0-alpha.1"}'
 *
 * Arguments:
 *   publishedPackages - JSON string containing array of {name, version} objects
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import semver from "semver";

interface PublishedPackage {
  name: string;
  version: string;
}

interface PreJson {
  mode?: string;
  tag?: string;
}

function readPreJson(): PreJson | null {
  const preJsonPath = resolve(process.cwd(), ".changeset/pre.json");

  try {
    const content = readFileSync(preJsonPath, "utf-8");
    return JSON.parse(content) as PreJson;
  } catch {
    console.log("No pre.json file found or unable to read it");
    return null;
  }
}

function readCurrentLatest(packageName: string): string | null {
  try {
    const out = execSync(`npm view ${packageName} dist-tags.latest`, {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    return out.length > 0 ? out : null;
  } catch {
    // Never published, or a registry hiccup — there is no `latest` to protect.
    return null;
  }
}

function updateDistTag(packageName: string, version: string, tag: string): void {
  const command = `pnpm dist-tag add ${packageName}@${version} ${tag}`;

  console.log(`Running: ${command}`);

  try {
    execSync(command, {
      stdio: "inherit",
      env: {
        ...process.env,
        // Ensure npm token is available from environment
        // NODE_AUTH_TOKEN: process.env.NPM_TOKEN || process.env.NODE_AUTH_TOKEN,
      },
    });
    console.log(`✓ Successfully tagged ${packageName}@${version} as ${tag}`);
  } catch (error) {
    console.error(`✗ Failed to tag ${packageName}@${version}:`, error);
    throw error;
  }
}

function main(): void {
  const publishedPackagesArg = process.argv[2];

  if (!publishedPackagesArg) {
    console.log("No published packages provided. Skipping dist-tag updates.");
    process.exit(0);
  }

  let publishedPackages: PublishedPackage[];
  try {
    publishedPackages = JSON.parse(publishedPackagesArg) as PublishedPackage[];
  } catch (error) {
    console.error("Failed to parse published packages argument:", error);
    process.exit(1);
  }

  if (!Array.isArray(publishedPackages) || publishedPackages.length === 0) {
    console.log("No packages were published. Skipping dist-tag updates.");
    process.exit(0);
  }

  const preJson = readPreJson();

  if (!preJson) {
    console.log("No prerelease configuration found. Skipping dist-tag updates.");
    process.exit(0);
  }

  if (preJson.mode !== "pre") {
    console.log(`Not in prerelease mode (mode: ${preJson.mode}). Skipping dist-tag updates.`);
    process.exit(0);
  }

  if (!preJson.tag) {
    console.error("Prerelease tag not found in pre.json");
    process.exit(1);
  }

  console.log(`Updating dist-tags for ${publishedPackages.length} package(s) with tag: ${preJson.tag}`);

  for (const pkg of publishedPackages) {
    updateDistTag(pkg.name, pkg.version, preJson.tag);

    const currentLatest = readCurrentLatest(pkg.name);
    if (currentLatest !== null && !semver.gt(pkg.version, currentLatest)) {
      console.log(`- Leaving ${pkg.name} latest at ${currentLatest} (not older than ${pkg.version})`);
      continue;
    }
    updateDistTag(pkg.name, pkg.version, "latest");
  }

  console.log("All dist-tags updated successfully!");
}

main();
