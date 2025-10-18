/*
 * This script checks if the version in R-Machine package.json follows semantic versioning (semver)
 * ---
 * Adapted from: Zod - https://github.com/colinhacks/zod/blob/main/scripts/check-semver.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const packageJsonPath = join(__dirname, "../packages/r-machine/package.json");

try {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  const version = packageJson.version;

  if (!version) {
    throw new Error("Version field is missing in package.json");
  }

  if (!semver.valid(version)) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  // check x.y.z format with regex
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(version)) {
    throw new Error(`Version ${version} does not match x.y.z format`);
  }

  console.log(`Valid semver version: ${version}`);
} catch (error: any) {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
