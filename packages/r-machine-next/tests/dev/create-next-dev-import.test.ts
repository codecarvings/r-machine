import { afterEach, describe, expect, it, vi } from "vitest";
import { createNextDevImport, isClientModuleSource } from "../../src/dev/create-next-dev-import.js";

const FORCE_DEV_LOADER_FLAG = Symbol.for("@r-machine:force-dev-loader");
const CACHE_KEY = Symbol.for("@r-machine/next:dev-import-cache");

function forceOn(): void {
  const slot = globalThis as unknown as { [FORCE_DEV_LOADER_FLAG]?: number };
  slot[FORCE_DEV_LOADER_FLAG] = (slot[FORCE_DEV_LOADER_FLAG] ?? 0) + 1;
}

// The process-wide importer cache lives on `process` (or `globalThis` when
// `process` is absent). Wipe both so each test re-probes from a clean slate.
function clearCaches(): void {
  delete (process as unknown as Record<symbol, unknown>)?.[CACHE_KEY];
  delete (globalThis as unknown as Record<symbol, unknown>)[CACHE_KEY];
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  delete (globalThis as unknown as Record<symbol, unknown>)[FORCE_DEV_LOADER_FLAG];
  clearCaches();
});

describe("isClientModuleSource", () => {
  it.each([
    ["double-quoted directive on line 1", '"use client";\nexport const x = 1;'],
    ["single-quoted directive on line 1", "'use client';\nexport const x = 1;"],
    [
      "directive after a license banner block comment",
      '/*\n * Copyright (c) 2026\n */\n\n"use client";\nimport { useRouter } from "next/navigation";',
    ],
    ["directive after line comments", '// note\n// another\n"use client";\n'],
  ])("returns true for %s", (_label, source) => {
    expect(isClientModuleSource(source)).toBe(true);
  });

  it.each([
    ["an isomorphic module with no directive", 'import { x } from "./x.js";\nexport const y = x;'],
    ["a server module", '"use server";\nexport async function action() {}'],
    ["a non-leading 'use client' string literal", 'export const label = "use client";\n'],
    ["empty source", ""],
  ])("returns false for %s", (_label, source) => {
    expect(isClientModuleSource(source)).toBe(false);
  });
});

describe("createNextDevImport — use-client boundary", () => {
  it("loads a server module that transitively imports a 'use client' module without crashing", async () => {
    forceOn();
    const devImport = await createNextDevImport(import.meta.url);
    // jiti is a workspace dep, so the loader must be active here. If this is
    // null, jiti failed to load — surface it rather than silently skipping.
    expect(devImport).not.toBeNull();

    // Before the boundary stub this threw ERR_MODULE_NOT_FOUND on
    // `next/navigation` while resolving the transitive client module.
    const mod = (await devImport?.("./_fixtures/use-client-chain/outer.ts")) as {
      marker: string;
      clientDefault: unknown;
      clientNamed: unknown;
    };

    // The server module loaded past the transitive `"use client"` import.
    expect(mod.marker).toBe("outer-loaded");
    // The client module collapsed to a client-reference stub: `default` is a
    // no-op callable; named exports resolve to undefined.
    expect(typeof mod.clientDefault).toBe("function");
    expect(mod.clientNamed).toBeUndefined();
  });
});

describe("createNextDevImport — activation gate", () => {
  it("returns null under NODE_ENV=production (jiti never loads in prod)", async () => {
    forceOn();
    vi.stubEnv("NODE_ENV", "production");
    expect(await createNextDevImport(import.meta.url)).toBeNull();
  });

  it("returns null on the Edge runtime (jiti is Node-only)", async () => {
    forceOn();
    vi.stubGlobal("EdgeRuntime", "edge");
    expect(await createNextDevImport(import.meta.url)).toBeNull();
  });

  it("returns null in a browser context without the force flag", async () => {
    // No force, browser-like global → server-side gate fails.
    vi.stubGlobal("window", {});
    expect(await createNextDevImport(import.meta.url)).toBeNull();
  });

  it("activates in a browser context when the force flag is set (verifyResourceAtlas/jsdom)", async () => {
    forceOn();
    vi.stubGlobal("window", {});
    // The force flag overrides the `!isServer` check so the verifier can run
    // the loader under jsdom.
    expect(await createNextDevImport(import.meta.url)).not.toBeNull();
  });

  it("returns null and falls back to the globalThis cache when process is undefined", async () => {
    // No force → the cache path runs `getCache`, which uses `globalThis` when
    // `process` is absent (browser without bundler env replacement).
    vi.stubGlobal("process", undefined);
    expect(await createNextDevImport(import.meta.url)).toBeNull();
  });
});

describe("createNextDevImport — caching", () => {
  it("memoizes the importer promise per importMetaUrl (no force)", async () => {
    // Ensure a clean, force-free state so the cache path (not the force
    // bypass) is exercised and `isForceDevLoaderActive` reads the unset slot.
    delete (globalThis as unknown as Record<symbol, unknown>)[FORCE_DEV_LOADER_FLAG];

    const first = createNextDevImport(import.meta.url);
    const second = createNextDevImport(import.meta.url);
    // Same cached promise on the second call (cache hit).
    expect(first).toBe(second);
    expect(await first).not.toBeNull();
  });
});
