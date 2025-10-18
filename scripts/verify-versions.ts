/*
 * This script verifies that all versions across the monorepo are consistent and valid
 * - Reads version from packages/r-machine/src/lib/version.ts
 * - Reads versions from all package.json files in packages/
 * - Ensures all versions match
 * - Validates semver compliance
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const packagesDir = join(__dirname, "../packages");
const versionTsPath = join(__dirname, "../packages/r-machine/src/lib/version.ts");

// Parse command line arguments
function parseArgs(): { checkTag: boolean } {
  const args = process.argv.slice(2);
  const checkTag = args.includes("-tag");
  return { checkTag };
}

function constructVersionString(versionObj: { major: number; minor: number; patch: string }): string {
  return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}`;
}

function readVersionFromVersionTs(): string {
  try {
    const content = readFileSync(versionTsPath, "utf-8");
    // Extract version object from TypeScript file
    const majorMatch = content.match(/major:\s*(\d+)/);
    const minorMatch = content.match(/minor:\s*(\d+)/);
    const patchMatch = content.match(/patch:\s*"([^"]+)"/);

    if (!majorMatch || !minorMatch || !patchMatch) {
      throw new Error("Could not parse version from version.ts");
    }

    const versionObj = {
      major: Number.parseInt(majorMatch[1], 10),
      minor: Number.parseInt(minorMatch[1], 10),
      patch: patchMatch[1],
    };

    return constructVersionString(versionObj);
  } catch (error: unknown) {
    throw new Error(
      `Failed to read version from ${versionTsPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function findPackageJsonFiles(): string[] {
  const packageJsonFiles: string[] = [];

  try {
    const entries = readdirSync(packagesDir);

    for (const entry of entries) {
      const entryPath = join(packagesDir, entry);
      const stat = statSync(entryPath);

      if (stat.isDirectory()) {
        const packageJsonPath = join(entryPath, "package.json");
        try {
          statSync(packageJsonPath); // Check if package.json exists
          packageJsonFiles.push(packageJsonPath);
        } catch {
          // package.json doesn't exist in this directory, skip
        }
      }
    }
  } catch (error: unknown) {
    throw new Error(`Failed to read packages directory: ${error instanceof Error ? error.message : String(error)}`);
  }

  return packageJsonFiles;
}

function readVersionFromPackageJson(path: string): string {
  try {
    const packageJson = JSON.parse(readFileSync(path, "utf-8"));
    if (!packageJson.version) {
      throw new Error(`Version field is missing in ${path}`);
    }
    return packageJson.version;
  } catch (error: unknown) {
    throw new Error(`Failed to read version from ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateSemver(version: string): void {
  if (!semver.valid(version)) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  // Check format with regex
  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  if (!semverRegex.test(version)) {
    throw new Error(`Invalid semver format: ${version}`);
  }
}

function validateTagFormat(version: string, tag: string): void {
  if (tag === "latest") {
    // For "latest" tag, version must be in x.y.z format (no alpha, beta, next, etc.)
    const xyzRegex = /^\d+\.\d+\.\d+$/;
    if (!xyzRegex.test(version)) {
      throw new Error(
        `Version "${version}" is not in x.y.z format. The "latest" tag requires a stable version without pre-release identifiers (e.g., no alpha, beta, next)`
      );
    }
  }
}

try {
  // Parse command line arguments
  const { checkTag } = parseArgs();

  // Read version from version.ts
  const versionTsVersion = readVersionFromVersionTs();
  console.log(`Version from version.ts: ${versionTsVersion}`);

  // Validate version.ts version
  validateSemver(versionTsVersion);

  // If -tag flag is provided, validate the version format for the npm tag
  if (checkTag) {
    const tag = process.env.npm_config_tag || "latest";
    console.log(`NPM Tag: ${tag}`);
    validateTagFormat(versionTsVersion, tag);
  } else {
    console.log(`NPM Tag check skipped`);
  }

  // Find and read all package.json files
  const packageJsonFiles = findPackageJsonFiles();

  if (packageJsonFiles.length === 0) {
    throw new Error("No package.json files found in packages directory");
  }

  const versions: Record<string, string> = {};
  for (const packageJsonPath of packageJsonFiles) {
    const version = readVersionFromPackageJson(packageJsonPath);
    validateSemver(version);
    versions[packageJsonPath] = version;
    console.log(`Version from ${packageJsonPath.replace(`${packagesDir}/`, "")}: ${version}`);
  }

  // Check if all versions match
  const allVersions = [versionTsVersion, ...Object.values(versions)];
  const uniqueVersions = [...new Set(allVersions)];

  if (uniqueVersions.length > 1) {
    throw new Error(
      `Version mismatch detected!\n  Found versions: ${uniqueVersions.join(", ")}\n  All versions must be identical`
    );
  }

  console.log(`\n✓ All versions are consistent and valid: ${versionTsVersion}`);
} catch (error: unknown) {
  console.error(`\n✗ Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
