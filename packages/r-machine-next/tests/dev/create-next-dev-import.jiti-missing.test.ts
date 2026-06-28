import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Simulate jiti not being installed: the dynamic `import("jiti")` rejects.
// Isolated in its own file because this mock is hoisted module-wide and would
// otherwise break the tests that exercise the real jiti loader.
vi.mock("jiti", () => {
  throw new Error("simulated: jiti is not installed");
});

import { createNextDevImport } from "../../src/dev/create-next-dev-import.js";

const FORCE_DEV_LOADER_FLAG = Symbol.for("@r-machine:force-dev-loader");
// Mirrors the module-private key written by `shouldFireOnceLog`.
const ENV_WARNED_KEY = "__R_MACHINE_NEXT_JITI_NOT_INSTALLED_WARNED";

beforeEach(() => {
  // Force activation so `buildDevImport` runs (and bypasses the cache), and
  // clear the once-only warn flag so the first call always logs.
  const slot = globalThis as unknown as { [FORCE_DEV_LOADER_FLAG]?: number };
  slot[FORCE_DEV_LOADER_FLAG] = (slot[FORCE_DEV_LOADER_FLAG] ?? 0) + 1;
  delete process.env[ENV_WARNED_KEY];
});

afterEach(() => {
  delete (globalThis as unknown as Record<symbol, unknown>)[FORCE_DEV_LOADER_FLAG];
  vi.restoreAllMocks();
});

describe("createNextDevImport — jiti unavailable", () => {
  it("returns null and warns exactly once across calls", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const first = await createNextDevImport(import.meta.url);
    const second = await createNextDevImport(import.meta.url);

    expect(first).toBeNull();
    expect(second).toBeNull();
    // `shouldFireOnceLog` dedupes via process.env: warn fires on the first
    // call, is suppressed on the second.
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("jiti is not installed"));
  });
});
