#!/usr/bin/env node

/**
 * Manages symlinks for package development.
 *
 * This script creates or removes a symlink from node_modules/PACKAGE_NAME to src/
 * within a package directory.
 * This is required for packages with multiple entry points that have references to each other.
 *
 * Usage:
 *   tsx scripts/package-build-symlink.ts <PACKAGE_PATH> <start|stop>
 *
 * Arguments:
 *   PACKAGE_PATH - Path to the package directory
 *   PHASE - Either "start" to create symlink or "stop" to remove it
 *
 * Example:
 *   tsx scripts/package-build-symlink.ts packages/r-machine start
 */

import { existsSync, mkdirSync, readFileSync, symlinkSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

interface PackageJson {
  name: string;
  [key: string]: unknown;
}

function readPackageJson(packagePath: string): PackageJson {
  const packageJsonPath = resolve(packagePath, "package.json");

  if (!existsSync(packageJsonPath)) {
    console.error(`Error: package.json not found at ${packageJsonPath}`);
    process.exit(1);
  }

  try {
    const content = readFileSync(packageJsonPath, "utf-8");
    return JSON.parse(content) as PackageJson;
  } catch (error) {
    console.error(`Error: Failed to read or parse package.json: ${error}`);
    process.exit(1);
  }
}

function createSymlink(packagePath: string): void {
  const packageJson = readPackageJson(packagePath);
  const packageName = packageJson.name;

  console.log(`Creating symlink for package: ${packageName}`);

  const nodeModulesPath = resolve(packagePath, "node_modules");
  const srcPath = resolve(packagePath, "src");

  // Check if src directory exists
  if (!existsSync(srcPath)) {
    console.error(`Error: src directory not found at ${srcPath}`);
    process.exit(1);
  }

  // Create node_modules directory if it doesn't exist
  if (!existsSync(nodeModulesPath)) {
    console.log(`Creating node_modules directory at ${nodeModulesPath}`);
    mkdirSync(nodeModulesPath, { recursive: true });
  }

  // Handle scoped packages (e.g., @r-machine/core)
  // For scoped packages, we need to create the scope directory first
  let symlinkPath: string;
  if (packageName.startsWith("@")) {
    const [scope, pkgName] = packageName.split("/");
    const scopePath = resolve(nodeModulesPath, scope);

    // Create scope directory if it doesn't exist
    if (!existsSync(scopePath)) {
      console.log(`Creating scope directory: ${scopePath}`);
      mkdirSync(scopePath, { recursive: true });
    }

    symlinkPath = resolve(scopePath, pkgName);
  } else {
    symlinkPath = resolve(nodeModulesPath, packageName);
  }

  // Check if symlink already exists
  if (existsSync(symlinkPath)) {
    console.log(`Symlink already exists at ${symlinkPath}`);
    return;
  }

  // Create the symlink
  try {
    symlinkSync(srcPath, symlinkPath, "dir");
    console.log(`✓ Successfully created symlink: ${symlinkPath} -> ${srcPath}`);
  } catch (error) {
    console.error(`Error: Failed to create symlink: ${error}`);
    process.exit(1);
  }
}

function removeSymlink(packagePath: string): void {
  const packageJson = readPackageJson(packagePath);
  const packageName = packageJson.name;

  console.log(`Removing symlink for package: ${packageName}`);

  const nodeModulesPath = resolve(packagePath, "node_modules");

  // Determine symlink path
  let symlinkPath: string;
  if (packageName.startsWith("@")) {
    const [scope, pkgName] = packageName.split("/");
    symlinkPath = resolve(nodeModulesPath, scope, pkgName);
  } else {
    symlinkPath = resolve(nodeModulesPath, packageName);
  }

  // Check if symlink exists
  if (!existsSync(symlinkPath)) {
    console.log(`Symlink does not exist at ${symlinkPath}`);
    return;
  }

  // Remove the symlink
  try {
    unlinkSync(symlinkPath);
    console.log(`✓ Successfully removed symlink: ${symlinkPath}`);
  } catch (error) {
    console.error(`Error: Failed to remove symlink: ${error}`);
    process.exit(1);
  }
}

function main(): void {
  const packagePath = process.argv[2];
  const phase = process.argv[3];

  if (!packagePath || !phase) {
    console.error("Usage: tsx scripts/package-build-symlink.ts <PACKAGE_PATH> <start|stop>");
    process.exit(1);
  }

  if (phase !== "start" && phase !== "stop") {
    console.error('Error: PHASE must be either "start" or "stop"');
    process.exit(1);
  }

  const resolvedPackagePath = resolve(packagePath);

  if (!existsSync(resolvedPackagePath)) {
    console.error(`Error: Package directory not found at ${resolvedPackagePath}`);
    process.exit(1);
  }

  if (phase === "start") {
    createSymlink(resolvedPackagePath);
  } else {
    removeSymlink(resolvedPackagePath);
  }
}

main();
