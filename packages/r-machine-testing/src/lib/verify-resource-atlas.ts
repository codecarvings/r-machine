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
import type ts from "typescript";

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
  | { kind: "config-access-failed"; reason: string };

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

  // ─── Runtime phase: import setup, reach the config via CONFIG_ACCESSOR ─
  let config: AnyConfig;
  try {
    const module = (await import(pathToFileURL(absoluteSetupFile).href)) as Record<string, unknown>;
    const strategy = module[strategyExportName];
    if (strategy === undefined || strategy === null) {
      throw new Error(`Setup file does not export "${strategyExportName}".`);
    }
    const accessor = (strategy as Record<symbol, unknown>)[CONFIG_ACCESSOR];
    if (typeof accessor !== "function") {
      throw new Error(
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

  // ─── Verification phase: enumerate keys × locales ──────────────────────
  const resolver = new ResLayoutResolver(config.layout);
  const issues: VerifyIssue[] = [];
  let totalChecks = 0;

  for (const extracted of extractedKeys) {
    const { key, sourceLocation } = extracted;
    let kind: ResLayoutEntryType;
    try {
      kind = resolver.resolveLayoutEntryType(key as AnyNamespace);
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
        await runCheck(key, locale, kind, config, resolver, sourceLocation, issues);
      }
    } else if (kind === "shell(mono)") {
      totalChecks++;
      await runCheck(key, config.defaultLocale, kind, config, resolver, sourceLocation, issues);
    } else {
      totalChecks++;
      await runCheck(key, undefined, kind, config, resolver, sourceLocation, issues);
    }
  }

  return {
    ok: issues.length === 0,
    setupFile: absoluteSetupFile,
    totalChecks,
    issues,
  };
}

async function runCheck(
  key: string,
  locale: string | undefined,
  kind: ResLayoutEntryType,
  config: AnyConfig,
  resolver: ResLayoutResolver,
  sourceLocation: SourceLocation,
  issues: VerifyIssue[]
): Promise<void> {
  const localePart: { locale?: string; isCanonical?: boolean } =
    locale !== undefined ? { locale, isCanonical: locale === config.defaultLocale } : {};

  const namespace = key as AnyNamespace;
  let modulePath: string;
  let loaderOptions: ResModuleLoaderFnOptions;
  try {
    modulePath = resolver.resolvePath(namespace, locale, kind);
    const namespaceParts = resolver.resolveNamespaceParts(namespace);
    const prefix = namespaceParts[0];
    loaderOptions = {
      namespace,
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
    throw new Error(`Could not load source file: ${setupFile}`);
  }

  const atlasClass = findResourceAtlasClass(tsModule, sourceFile, checker, new Set());
  if (!atlasClass) {
    throw new Error(
      `Could not locate a "ResourceAtlas" class reachable from ${setupFile}. The check follows the import graph starting from the setup file.`
    );
  }

  const classType = checker.getTypeAtLocation(atlasClass);
  const shapeProp = checker.getPropertiesOfType(classType).find((s) => s.name === "shape");
  if (!shapeProp) {
    throw new Error(`The "ResourceAtlas" class has no "shape" property — is it built from defineLayout()?`);
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
  if (visited.has(sourceFile.fileName)) return undefined;
  visited.add(sourceFile.fileName);

  let local: ts.ClassDeclaration | undefined;
  tsModule.forEachChild(sourceFile, (node) => {
    if (tsModule.isClassDeclaration(node) && node.name?.text === "ResourceAtlas") {
      local = node;
    }
  });
  if (local) return local;

  for (const stmt of sourceFile.statements) {
    if (!tsModule.isImportDeclaration(stmt)) continue;
    const moduleSpec = stmt.moduleSpecifier;
    if (!tsModule.isStringLiteral(moduleSpec)) continue;
    const moduleSymbol = checker.getSymbolAtLocation(moduleSpec);
    const imported = moduleSymbol?.declarations?.[0]?.getSourceFile();
    if (!imported) continue;
    const found = findResourceAtlasClass(tsModule, imported, checker, visited);
    if (found) return found;
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
  if (!configPath) return {};
  const configFile = tsModule.readConfigFile(configPath, tsModule.sys.readFile);
  if (!configFile.config) return {};
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
    throw new Error(
      `verifyResourceAtlas requires the "typescript" package as a peer dependency. Install it in your project. Underlying error: ${errorMessage(err)}`
    );
  }
}

// ─── Error utilities ────────────────────────────────────────────────────

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
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
