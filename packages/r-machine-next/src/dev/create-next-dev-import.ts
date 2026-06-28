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

// Marker for Vercel's Edge runtime — see https://nextjs.org/docs/app/api-reference/edge.
declare const EdgeRuntime: unknown;

// `jiti` is an opt-in user-installed dev dep — not declared in this package's
// deps, so TS can't resolve it. We hand-model the slice we use and silence
// the import-resolution error with `@ts-expect-error` at the call site. The
// import specifier remains a plain string literal so Turbopack/Webpack can
// statically resolve and bundle it at build time (a `"jiti" as string` cast
// would be refused as "too dynamic" by Turbopack).
// `transform` mirrors jiti's instance method: it receives the source (plus
// internal fields we don't model) and returns the transpiled code string. We
// borrow it from a "base" instance to delegate default transpilation — see
// the `"use client"` stub note in `buildDevImport`.
type JitiTransformOptions = { source: string };
type JitiInstance = {
  import(path: string): Promise<unknown>;
  transform(opts: JitiTransformOptions): string;
};
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

// Cross-package coordination flag. Set on `globalThis` by tooling that needs
// the dev importer (jiti) to activate regardless of the `typeof window`
// check — primarily `@r-machine/testing`'s `verifyResourceAtlas`, which may
// run inside a jsdom-based vitest environment where `window` is defined.
// Contract: ref-counted; presence of any positive count force-activates.
// Identity is via `Symbol.for(...)` (registry symbol), stable across realms
// and packages without sharing code.
const FORCE_DEV_LOADER_FLAG = Symbol.for("@r-machine:force-dev-loader");

function isForceDevLoaderActive(): boolean {
  const slot = globalThis as unknown as { [FORCE_DEV_LOADER_FLAG]?: number };
  return (slot[FORCE_DEV_LOADER_FLAG] ?? 0) > 0;
}

// ─── Observation flags (cross-package diagnostic signal) ────────────────
// `@r-machine/testing`'s `verifyResourceAtlas` reads these to differentiate
// "loader errors in a Next project where jiti didn't activate" (actionable
// hint: install jiti) from generic loader errors (real bugs to investigate).
//
// `attempted` is set on every `createNextDevImport` call: presence means
// "this is a Next project that opted into the dev importer." `enabled` is
// set only when `jiti.createJiti()` succeeds. Both use `Symbol.for(...)` so
// identity is stable across packages without sharing code. The verifier
// clears these before each run so observations are per-verification.
const DEV_LOADER_ATTEMPTED_FLAG = Symbol.for("@r-machine:dev-loader-attempted");
const DEV_LOADER_ENABLED_FLAG = Symbol.for("@r-machine:dev-loader-enabled");
type ObservationSlot = {
  [DEV_LOADER_ATTEMPTED_FLAG]?: true;
  [DEV_LOADER_ENABLED_FLAG]?: true;
};

function markDevLoaderAttempted(): void {
  (globalThis as unknown as ObservationSlot)[DEV_LOADER_ATTEMPTED_FLAG] = true;
}

function markDevLoaderEnabled(): void {
  (globalThis as unknown as ObservationSlot)[DEV_LOADER_ENABLED_FLAG] = true;
}

// ─── "use client" boundary awareness ───────────────────────────────────
// Next replaces a `"use client"` module imported from server code with a
// *client reference* (a proxy): its body never executes on the server, so its
// browser-only imports (e.g. `next/navigation`) are never resolved there. jiti
// has no such boundary — it follows the static import graph straight through a
// `"use client"` module and into `next/navigation`, which it can't resolve as
// a bare ESM specifier, crashing the resource-module load in dev. We restore
// the boundary by detecting the directive and swapping the module body for a
// stub that mirrors Next's client reference (see `buildDevImport`).

// Matches a `"use client"` directive as the first statement, tolerating a
// leading license banner (block comment), line comments, and whitespace.
const USE_CLIENT_RE = /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*\s*(['"])use client\1/;

/**
 * True when `source` begins with a `"use client"` directive — i.e. the module
 * is client code that the dev loader must stub rather than execute server-side.
 * Exported for unit testing the detection in isolation.
 */
export function isClientModuleSource(source: string): boolean {
  return USE_CLIENT_RE.test(source);
}

// Replacement body for a `"use client"` module under jiti. jiti transpiles
// ESM to CJS internally and builds the import namespace by copying the
// *enumerable own keys* of `module.exports` (a Proxy can't fake names it can't
// enumerate), so we can only meaningfully provide `default`. That is enough:
// the server resource graph passes client modules around as references and
// never reads their named exports at load time — a named import of a stubbed
// module resolves to `undefined`, exactly like Next's client reference where
// the value is opaque server-side. `default` is a harmless no-op callable in
// case something renders it. `__esModule` keeps jiti's interop on the ESM path.
const CLIENT_MODULE_STUB =
  'Object.defineProperty(exports, "__esModule", { value: true });' + "exports.default = function ClientReference() {};";

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
 * Typical usage in a loader file (`pub/loader.ts` / `prv/loader.ts`):
 *
 *     const devImport = await createNextDevImport(import.meta.url);
 *
 *     ResourceAtlas.loader.register(["base/", "shell/", "shell/lib/", "outer/", "vertex/"], (path) =>
 *       devImport ? devImport(`./${path}`) : import(`./${path}`)
 *     );
 */
export function createNextDevImport(importMetaUrl: string): Promise<DevImport> {
  // Diagnostic signal: every call marks the project as "Next setup that
  // opted into the dev importer." Read by `verifyResourceAtlas` to tell
  // jiti-missing apart from generic loader errors.
  markDevLoaderAttempted();
  // Bypass cache when the testing flag is active. A prior evaluation under
  // `typeof window !== "undefined"` would have cached `null`; under the flag
  // we want the jiti branch re-evaluated. Skipping the cache entirely keeps
  // the logic simple — there's no cache-pollution risk because the only
  // caller in this mode is a one-shot verifier test.
  if (isForceDevLoaderActive()) {
    return buildDevImport(importMetaUrl);
  }
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
  /* v8 ignore start -- defensive: this helper is only ever called from the
     jiti-missing catch in `buildDevImport`, which is reachable only after the
     gate has confirmed a server runtime with `process` present, so the
     no-`process` / no-`process.env` branch never runs from the dev flow. */
  if (typeof process === "undefined" || !process.env) {
    // Browser/Edge: no shared storage available. Best-effort = always fire.
    return true;
  }
  /* v8 ignore stop */
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
  // The testing flag forces activation under jsdom (window is defined) so
  // `verifyResourceAtlas` can run without requiring the user to add a
  // `// @vitest-environment node` pragma. Edge and production checks are
  // unaffected — jiti still won't load there.
  const forceDevLoader = isForceDevLoaderActive();

  if (!isDev || isEdge || (!isServer && !forceDevLoader)) {
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

  const jitiOpts = {
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
    alias: {
      // `server-only` throws on import to fence server code out of client
      // bundles. jiti has no bundle boundary, so let it resolve to an empty
      // no-op barrel instead of crashing the resource-module load. (Orthogonal
      // to the `"use client"` stub below: this handles a bare specifier, that
      // handles whole modules carrying the directive.)
      "server-only": "@r-machine/next/dev/no-op",
    },
  };

  // A "base" instance with the default (babel) transform. We don't import with
  // it — we only borrow its `transform` to delegate transpilation of ordinary
  // (non-`"use client"`) modules, so the real instance below can intercept the
  // directive without reimplementing jiti's TS/JSX pipeline.
  const base = jitiModule.createJiti(importMetaUrl, jitiOpts);

  const jiti = jitiModule.createJiti(importMetaUrl, {
    ...jitiOpts,
    // Restore the server/client boundary jiti would otherwise flatten: stub
    // `"use client"` modules with a client reference, mirroring what Next does
    // in a real build. Only `"use client"` is stubbed — `"use server"` modules
    // are server code and must run. This is always safe here: the dev loader
    // walks the *server* resource graph, which never needs to execute client
    // code (Next would replace it with a reference too).
    transform(opts: JitiTransformOptions) {
      if (isClientModuleSource(opts.source)) {
        return { code: CLIENT_MODULE_STUB };
      }
      return { code: base.transform(opts) };
    },
  });

  // Diagnostic signal: jiti loaded successfully. Read by `verifyResourceAtlas`
  // to distinguish "loader errors with jiti active" (real bugs) from
  // "loader errors with jiti unavailable" (install hint).
  markDevLoaderEnabled();

  return (path: string) => jiti.import(path);
}
