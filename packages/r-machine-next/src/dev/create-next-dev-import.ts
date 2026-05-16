/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of @r-machine/next, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

// Ambient `process` (no @types/node — @r-machine/next stays runtime-agnostic).
// The `typeof` guard at the call site keeps this safe in the browser, where
// bundlers don't statically replace `process.env.NODE_ENV`. We also write a
// couple of internal "log-already-emitted" flags into `process.env`; those
// keys persist across Next dev's context resets (Turbopack rebuilds the
// module graph per request, but `process.env` survives), so we dedup the
// jiti warn/info logs across requests where module-level state cannot.
declare const process: { env: Record<string, string | undefined> } | undefined;

const ENV_NO_JITI_WARNED = "__R_MACHINE_NEXT_JITI_NOT_INSTALLED_WARNED";
const ENV_JITI_ACTIVE_LOGGED = "__R_MACHINE_NEXT_JITI_ACTIVE_LOGGED";

// Marker for Vercel's Edge runtime — see https://nextjs.org/docs/app/api-reference/edge.
declare const EdgeRuntime: unknown;

// `jiti` is an opt-in user-installed dev dep — not declared in this package's
// deps, so TS can't resolve it. We hand-model the slice we use and silence
// the import-resolution error with `@ts-expect-error` at the call site. The
// import specifier remains a plain string literal so Turbopack/Webpack can
// statically resolve and bundle it at build time (a `"jiti" as string` cast
// would be refused as "too dynamic" by Turbopack).
type JitiInstance = { import(path: string): Promise<unknown> };
type JitiModule = {
  createJiti(url: string, opts: Record<string, unknown>): JitiInstance;
};

type DevImport = ((path: string) => Promise<unknown>) | null;

// Process-wide cache keyed by `importMetaUrl`. Next dev evaluates `setup.ts`
// multiple times in the same Node process — one per bundle context
// (middleware, server components, RSC, client component SSR) and again on
// each HMR reload. Without this cache each evaluation would spawn a fresh
// jiti instance and re-emit the warn/info logs.
//
// The cache lives on Node's `process` object (when available) — not on
// `globalThis`. Turbopack isolates bundle contexts with separate
// `globalThis` instances, so a `globalThis`-keyed cache would deduplicate only
// within one context. `process` is a Node singleton, shared across
// contexts. In environments without `process` (Edge, browser) we fall back
// to `globalThis`; in those environments deduplicate is per-context, which is
// the best we can do.
const CACHE_KEY = Symbol.for("@r-machine/next:dev-import-cache");
type Cache = Map<string, Promise<DevImport>>;
function getCache(): Cache {
  const host = (typeof process !== "undefined" ? process : globalThis) as unknown as Record<symbol, unknown>;
  let cache = host[CACHE_KEY] as Cache | undefined;
  if (!cache) {
    cache = new Map();
    host[CACHE_KEY] = cache;
  }
  return cache;
}

/**
 * Attempts to build a development-mode module importer backed by `jiti`,
 * bypassing Next/Turbopack's server-side module cache so that file edits on
 * resource modules (OuterGear factories, Shells, Base/Inner gears) propagate
 * to subsequent SSR renders without restarting the dev server.
 *
 * Returns a function `(path) => Promise<module>` when ALL the following hold:
 * - `NODE_ENV !== "production"`
 * - running on the server (no `window`)
 * - not the Edge runtime (jiti is Node-only)
 * - `jiti` is installed
 *
 * Returns `null` otherwise. The caller is expected to fall through to a
 * native dynamic import in that case, so the production-side `import()`
 * template literal stays in user code where the bundler can statically scan
 * it for context replacement.
 *
 * The result is cached per `importMetaUrl` on `globalThis`: the first call
 * does the jiti probe and emits any warn/info log; subsequent calls in the
 * same Node process return the cached promise silently.
 *
 * Typical usage in `setup.ts`:
 *
 *     const devImport = await createNextDevImport(import.meta.url);
 *     const rMachine = RMachine.create({
 *       load: (path) => (devImport ? devImport(`./${path}`) : import(`./${path}`)),
 *       // ...
 *     });
 */
export function createNextDevImport(importMetaUrl: string): Promise<DevImport> {
  const cache = getCache();
  let result = cache.get(importMetaUrl);
  if (result === undefined) {
    result = buildDevImport(importMetaUrl);
    cache.set(importMetaUrl, result);
  }
  return result;
}

// Mark a one-shot log line as already emitted by writing a flag into
// `process.env`. Module-level booleans don't survive Turbopack's per-
// request module-graph rebuilds in dev, and custom properties on `process`
// itself appeared to be wiped too; `process.env` empirically does persist
// across these resets. Returns true if we should fire the log, false if it
// was already emitted earlier.
function shouldFireOnceLog(envKey: string): boolean {
  if (typeof process === "undefined" || !process.env) {
    // Browser/Edge: no shared storage available. Best-effort = always fire,
    // but in practice this code path is gated on `isServer && !isEdge`, so
    // we never reach here from the dev flow.
    return true;
  }
  if (process.env[envKey] === "1") {
    return false;
  }
  process.env[envKey] = "1";
  return true;
}

async function buildDevImport(importMetaUrl: string): Promise<DevImport> {
  const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";
  const isServer = typeof window === "undefined";
  const isEdge = typeof EdgeRuntime === "string";

  if (!isDev || !isServer || isEdge) {
    return null;
  }

  let jitiModule: JitiModule;
  try {
    // The magic comments tell Webpack and Turbopack to LEAVE this import
    // alone: don't try to resolve `jiti` from inside @r-machine/next's tree
    // (we don't declare it as a dep), don't include it in the bundle. At
    // runtime, Node's ESM loader resolves it from the user's node_modules —
    // where jiti lives as an opt-in dev dep installed by the user.
    jitiModule = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "jiti")) as JitiModule;
  } catch {
    if (shouldFireOnceLog(ENV_NO_JITI_WARNED)) {
      console.warn(
        "[@r-machine/next] jiti is not installed — HMR on resource modules will not work in dev.\n" +
          "  Install it as a dev dependency to enable it:\n" +
          "    pnpm add -D jiti"
      );
    }
    return null;
  }

  const jiti = jitiModule.createJiti(importMetaUrl, {
    // Disable both caches so every import re-reads + re-transpiles from disk.
    // That is what makes resource-module edits propagate across SSR requests
    // without a dev-server restart.
    fsCache: false,
    moduleCache: false,
    // Honor `paths`/`baseUrl` in the user's tsconfig so imports like
    // `@/foo` inside resource modules resolve as they do under Next.
    tsconfigPaths: true,
    sourceMaps: true,
    // Modern JSX transform: no need for an explicit `import React` in TSX
    // resource modules.
    jsx: { runtime: "automatic" },
  });

  if (shouldFireOnceLog(ENV_JITI_ACTIVE_LOGGED)) {
    console.info(
      "[@r-machine/next] jiti dev importer enabled — edits to resource modules will propagate without restarting the dev server"
    );
  }
  return (path: string) => jiti.import(path);
}
