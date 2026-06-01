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

import nodePath from "node:path";
import { pathToFileURL } from "node:url";
import { CONFIG_ACCESSOR, type RMachineConfig } from "r-machine";
import {
  type AnyNamespace,
  type ResLayoutEntryType,
  ResLayoutResolver,
  type ResModuleLoaderFnOptions,
  validateResModule,
} from "r-machine/core";
import { RMachineUsageError } from "r-machine/errors";
import type ts from "typescript";
import { ERR_VERIFY_SETUP_INVALID } from "#r-machine/testing/errors";

export type SourceLocation = {
  file: string;
  line: number;
  column: number;
};

export type VerifyIssue =
  | {
      kind: "missing-resource";
      key: string;
      locale?: string;
      isCanonical?: boolean;
      sourceLocation?: SourceLocation;
    }
  | {
      kind: "loader-error";
      key: string;
      locale?: string;
      isCanonical?: boolean;
      error: { name: string; message: string; stack?: string };
      sourceLocation?: SourceLocation;
    }
  | {
      kind: "invalid-module-shape";
      key: string;
      locale?: string;
      isCanonical?: boolean;
      reason: string;
      sourceLocation?: SourceLocation;
    }
  | { kind: "atlas-extraction-failed"; reason: string }
  | { kind: "config-access-failed"; reason: string }
  | { kind: "dev-loader-not-active"; reason: string };

export type VerifyReport = {
  ok: boolean;
  setupFile: string;
  totalChecks: number;
  issues: VerifyIssue[];
};

export type VerifyResourceAtlasOptions = {
  /** Named export on the setup file that exposes the strategy. Default: "strategy". */
  strategyExportName?: string;
  /** Path to a tsconfig.json used for the static analysis pass. Defaults to the nearest one to setupFile. */
  tsconfig?: string;
};

type ExtractedKey = {
  key: string;
  sourceLocation: SourceLocation;
};

type AnyConfig = RMachineConfig<any, any, any, any>;

// ─── Cross-package dev-loader flag ──────────────────────────────────────
// Setting this symbol on `globalThis` signals tools like
// `@r-machine/next/createNextDevImport` to force their dev importer (jiti)
// active regardless of the usual `typeof window === "undefined"` gate.
// Lets `verifyResourceAtlas` run in jsdom environments (vitest's default
// for many web examples) without requiring the user to add the
// `// @vitest-environment node` pragma.
//
// Contract: the symbol is `Symbol.for(...)` (registry symbol) so identity
// is stable across realms and across packages without sharing code. Refer
// to `@r-machine/next/dev/create-next-dev-import.ts` for the consumer.
const FORCE_DEV_LOADER_FLAG = Symbol.for("@r-machine:force-dev-loader");
type FlagSlot = { [FORCE_DEV_LOADER_FLAG]?: number };

function acquireForceDevLoaderFlag(): void {
  const slot = globalThis as unknown as FlagSlot;
  slot[FORCE_DEV_LOADER_FLAG] = (slot[FORCE_DEV_LOADER_FLAG] ?? 0) + 1;
}

function releaseForceDevLoaderFlag(): void {
  const slot = globalThis as unknown as FlagSlot;
  const next = (slot[FORCE_DEV_LOADER_FLAG] ?? 0) - 1;
  if (next <= 0) {
    delete slot[FORCE_DEV_LOADER_FLAG];
  } else {
    slot[FORCE_DEV_LOADER_FLAG] = next;
  }
}

// ─── Cross-package observation flags (read from @r-machine/next) ────────
// `@r-machine/next`'s `createNextDevImport` writes these to signal whether
// the dev importer (jiti) was attempted and whether it activated. We reset
// them at the start of every verify call and inspect them at the end to
// emit an actionable hint when a Next setup is detected but jiti didn't
// start.
const DEV_LOADER_ATTEMPTED_FLAG = Symbol.for("@r-machine:dev-loader-attempted");
const DEV_LOADER_ENABLED_FLAG = Symbol.for("@r-machine:dev-loader-enabled");
type ObservationSlot = {
  [DEV_LOADER_ATTEMPTED_FLAG]?: true;
  [DEV_LOADER_ENABLED_FLAG]?: true;
};

function clearDevLoaderObservationFlags(): void {
  const slot = globalThis as unknown as ObservationSlot;
  delete slot[DEV_LOADER_ATTEMPTED_FLAG];
  delete slot[DEV_LOADER_ENABLED_FLAG];
}

function isDevLoaderAttempted(): boolean {
  return (globalThis as unknown as ObservationSlot)[DEV_LOADER_ATTEMPTED_FLAG] === true;
}

function isDevLoaderEnabled(): boolean {
  return (globalThis as unknown as ObservationSlot)[DEV_LOADER_ENABLED_FLAG] === true;
}

function hasLoaderRelatedIssue(issues: VerifyIssue[]): boolean {
  return issues.some(
    (i) => i.kind === "loader-error" || i.kind === "missing-resource" || i.kind === "invalid-module-shape"
  );
}

export async function verifyResourceAtlas(
  setupFile: string,
  options?: VerifyResourceAtlasOptions
): Promise<VerifyReport> {
  const absoluteSetupFile = nodePath.resolve(setupFile);
  const strategyExportName = options?.strategyExportName ?? "strategy";

  // ─── Static phase: extract atlas keys via TS Compiler API ──────────────
  let extractedKeys: ExtractedKey[];
  try {
    extractedKeys = await extractAtlasKeys(absoluteSetupFile, options?.tsconfig);
  } catch (err) {
    return {
      ok: false,
      setupFile: absoluteSetupFile,
      totalChecks: 0,
      issues: [{ kind: "atlas-extraction-failed", reason: errorMessage(err) }],
    };
  }

  // Reset observation flags so a previous verification in the same worker
  // doesn't leak its "Next setup" signal into this one.
  clearDevLoaderObservationFlags();

  // Reference-counted: safe under concurrent `verifyResourceAtlas` calls in
  // the same worker. Wraps both the runtime import of `setupFile` and the
  // verification loop so any nested loader call also sees the flag.
  acquireForceDevLoaderFlag();
  try {
    // ─── Runtime phase: import setup, reach the config via CONFIG_ACCESSOR ─
    let config: AnyConfig;
    try {
      const module = (await import(pathToFileURL(absoluteSetupFile).href)) as Record<string, unknown>;
      const strategy = module[strategyExportName];
      if (strategy === undefined || strategy === null) {
        throw new RMachineUsageError(ERR_VERIFY_SETUP_INVALID, `Setup file does not export "${strategyExportName}".`);
      }
      const accessor = (strategy as Record<symbol, unknown>)[CONFIG_ACCESSOR];
      if (typeof accessor !== "function") {
        throw new RMachineUsageError(
          ERR_VERIFY_SETUP_INVALID,
          `Export "${strategyExportName}" does not expose CONFIG_ACCESSOR — make sure it is a r-machine Strategy or RMachine instance.`
        );
      }
      config = accessor.call(strategy) as AnyConfig;
    } catch (err) {
      return {
        ok: false,
        setupFile: absoluteSetupFile,
        totalChecks: 0,
        issues: [{ kind: "config-access-failed", reason: errorMessage(err) }],
      };
    }

    // ─── Verification phase: enumerate keys × locales ────────────────────
    const resolver = new ResLayoutResolver(config.layout);
    const issues: VerifyIssue[] = [];
    let totalChecks = 0;

    for (const extracted of extractedKeys) {
      const { key, sourceLocation } = extracted;
      // Atlas keys may start with `#` to mark them as internal (consumer-hidden).
      // The runtime sees only the bare form — `getNamespace` strips the marker
      // when building kit/priority/bridgeGears. Mirror that here so resolver and
      // loader receive the same namespace shape they would in production. The
      // original `#`-prefixed key is preserved in issue reports.
      const namespace = stripInternalMarker(key);
      let kind: ResLayoutEntryType;
      try {
        kind = resolver.resolveLayoutEntryType(namespace as AnyNamespace);
      } catch (err) {
        // Key declared in atlas but no layout entry covers its prefix.
        totalChecks++;
        issues.push({
          kind: "loader-error",
          key,
          error: serializeError(err),
          sourceLocation,
        });
        continue;
      }

      if (kind === "shell") {
        for (const locale of config.locales) {
          totalChecks++;
          await runCheck(key, namespace, locale, kind, config, resolver, sourceLocation, issues);
        }
      } else if (kind === "shell(mono)") {
        totalChecks++;
        await runCheck(key, namespace, config.defaultLocale, kind, config, resolver, sourceLocation, issues);
      } else {
        totalChecks++;
        await runCheck(key, namespace, undefined, kind, config, resolver, sourceLocation, issues);
      }
    }

    // If we hit any loader-related issue inside a Next setup that didn't
    // activate jiti, surface the most likely root cause so the user is not
    // left chasing per-resource errors.
    if (hasLoaderRelatedIssue(issues) && isDevLoaderAttempted() && !isDevLoaderEnabled()) {
      issues.push({
        kind: "dev-loader-not-active",
        reason:
          "The @r-machine/next dev importer was invoked but jiti did not activate — most likely jiti is not installed. " +
          "Install it as a dev dependency: `pnpm add -D jiti` (or the equivalent for your package manager).",
      });
    }

    return {
      ok: issues.length === 0,
      setupFile: absoluteSetupFile,
      totalChecks,
      issues,
    };
  } finally {
    releaseForceDevLoaderFlag();
  }
}

async function runCheck(
  key: string,
  namespace: string,
  locale: string | undefined,
  kind: ResLayoutEntryType,
  config: AnyConfig,
  resolver: ResLayoutResolver,
  sourceLocation: SourceLocation,
  issues: VerifyIssue[]
): Promise<void> {
  const localePart: { locale?: string; isCanonical?: boolean } =
    locale !== undefined ? { locale, isCanonical: locale === config.defaultLocale } : {};

  const bareNamespace = namespace as AnyNamespace;
  let modulePath: string;
  let loaderOptions: ResModuleLoaderFnOptions;
  try {
    modulePath = resolver.resolvePath(bareNamespace, locale, kind);
    const namespaceParts = resolver.resolveNamespaceParts(bareNamespace);
    const prefix = namespaceParts[0];
    loaderOptions = {
      namespace: bareNamespace,
      namespaceParts,
      pathParts: [prefix, modulePath.slice(prefix.length)],
      locale,
    };
  } catch (err) {
    issues.push({
      kind: "loader-error",
      key,
      ...localePart,
      error: serializeError(err),
      sourceLocation,
    });
    return;
  }

  let result: unknown;
  try {
    result = await config.load(modulePath, loaderOptions);
  } catch (err) {
    issues.push({
      kind: "loader-error",
      key,
      ...localePart,
      error: serializeError(err),
      sourceLocation,
    });
    return;
  }

  if (result === undefined || result === null) {
    issues.push({
      kind: "missing-resource",
      key,
      ...localePart,
      sourceLocation,
    });
    return;
  }

  const validationError = validateResModule(result);
  if (validationError) {
    issues.push({
      kind: "invalid-module-shape",
      key,
      ...localePart,
      reason: validationError.message,
      sourceLocation,
    });
  }
}

// ─── Static extraction via TS Compiler API ──────────────────────────────

async function extractAtlasKeys(setupFile: string, tsconfigPath?: string): Promise<ExtractedKey[]> {
  const tsModule = await loadTypeScript();
  const compilerOptions = readCompilerOptions(tsModule, setupFile, tsconfigPath);
  const program = tsModule.createProgram([setupFile], compilerOptions);
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(setupFile);
  if (!sourceFile) {
    throw new RMachineUsageError(ERR_VERIFY_SETUP_INVALID, `Could not load source file: ${setupFile}`);
  }

  const atlasClass = findResourceAtlasClass(tsModule, sourceFile, checker, new Set());
  if (!atlasClass) {
    throw new RMachineUsageError(
      ERR_VERIFY_SETUP_INVALID,
      `Could not locate a "ResourceAtlas" class reachable from ${setupFile}. The check follows the import graph starting from the setup file.`
    );
  }

  const classType = checker.getTypeAtLocation(atlasClass);
  const shapeProp = checker.getPropertiesOfType(classType).find((s) => s.name === "shape");
  if (!shapeProp) {
    throw new RMachineUsageError(
      ERR_VERIFY_SETUP_INVALID,
      `The "ResourceAtlas" class has no "shape" property — is it built from defineLayout()?`
    );
  }

  const shapeType = checker.getTypeOfSymbolAtLocation(shapeProp, atlasClass);
  const result: ExtractedKey[] = [];
  for (const prop of checker.getPropertiesOfType(shapeType)) {
    const decl = prop.declarations?.[0];
    const sourceLocation = decl ? extractSourceLocation(decl) : { file: setupFile, line: 0, column: 0 };
    result.push({ key: prop.name, sourceLocation });
  }
  return result;
}

function findResourceAtlasClass(
  tsModule: typeof ts,
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  visited: Set<string>
): ts.ClassDeclaration | undefined {
  if (visited.has(sourceFile.fileName)) {
    return undefined;
  }
  visited.add(sourceFile.fileName);

  let local: ts.ClassDeclaration | undefined;
  tsModule.forEachChild(sourceFile, (node) => {
    if (tsModule.isClassDeclaration(node) && node.name?.text === "ResourceAtlas") {
      local = node;
    }
  });
  if (local) {
    return local;
  }

  for (const stmt of sourceFile.statements) {
    if (!tsModule.isImportDeclaration(stmt)) {
      continue;
    }
    const moduleSpec = stmt.moduleSpecifier;
    if (!tsModule.isStringLiteral(moduleSpec)) {
      continue;
    }
    const moduleSymbol = checker.getSymbolAtLocation(moduleSpec);
    const imported = moduleSymbol?.declarations?.[0]?.getSourceFile();
    if (!imported) {
      continue;
    }
    const found = findResourceAtlasClass(tsModule, imported, checker, visited);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function readCompilerOptions(
  tsModule: typeof ts,
  setupFile: string,
  tsconfigPath: string | undefined
): ts.CompilerOptions {
  const configPath =
    tsconfigPath ?? tsModule.findConfigFile(nodePath.dirname(setupFile), tsModule.sys.fileExists, "tsconfig.json");
  if (!configPath) {
    return {};
  }
  const configFile = tsModule.readConfigFile(configPath, tsModule.sys.readFile);
  if (!configFile.config) {
    return {};
  }
  const parsed = tsModule.parseJsonConfigFileContent(configFile.config, tsModule.sys, nodePath.dirname(configPath));
  return parsed.options;
}

function extractSourceLocation(node: ts.Node): SourceLocation {
  const sourceFile = node.getSourceFile();
  const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return {
    file: sourceFile.fileName,
    line: pos.line + 1,
    column: pos.character + 1,
  };
}

async function loadTypeScript(): Promise<typeof ts> {
  try {
    return (await import("typescript")).default;
  } catch (err) {
    throw new RMachineUsageError(
      ERR_VERIFY_SETUP_INVALID,
      `verifyResourceAtlas requires the "typescript" package as a peer dependency. Install it in your project.`,
      err instanceof Error ? err : undefined
    );
  }
}

function stripInternalMarker(name: string): string {
  return name.charCodeAt(0) === 0x23 /* '#' */ ? name.slice(1) : name;
}

// ─── Error utilities ────────────────────────────────────────────────────

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

function serializeError(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) {
    return {
      name: err.name || "Error",
      message: err.message,
      ...(err.stack !== undefined ? { stack: err.stack } : {}),
    };
  }
  return { name: "UnknownError", message: String(err) };
}
