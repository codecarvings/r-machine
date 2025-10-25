#!/usr/bin/env node

/**
 * Updates npm dist-tags for published packages when in prerelease mode.
 *
 * This script reads the changeset prerelease configuration and applies the
 * appropriate dist-tag to packages that were just published. This ensures
 * that prerelease versions (e.g., alpha, beta) are tagged correctly on npm.
 *
 * Usage:
 *   tsx scripts/update-dist-tags.ts '{"name":"pkg","version":"1.0.0-alpha.1"}'
 *
 * Arguments:
 *   publishedPackages - JSON string containing array of {name, version} objects
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

function updateDistTag(packageName: string, version: string, tag: string): void {
  const command = `pnpm dist-tag add ${packageName}@${version} ${tag}`;

  console.log(`Running: ${command}`);

  try {
    execSync(command, {
      stdio: "inherit",
      env: {
        ...process.env,
        // Ensure npm token is available from environment
        NODE_AUTH_TOKEN: process.env.NPM_TOKEN || process.env.NODE_AUTH_TOKEN,
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
  }

  console.log("All dist-tags updated successfully!");
}

main();
