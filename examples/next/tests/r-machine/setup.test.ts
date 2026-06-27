import { verifyResourceAtlas } from "@r-machine/testing";
import { describe, expect, it } from "vitest";

describe("setup.ts ResourceAtlas", () => {
  it("every declared atlas key resolves for every locale", async () => {
    const report = await verifyResourceAtlas(import.meta.resolve("../../src/r-machine/setup.ts"), {
      // setup.ts only imports pub/loader; pull in the server-only prv/loader so
      // the `inner/` prefix is registered and its resources are verified too.
      loaders: [import.meta.resolve("../../src/r-machine/prv/loader.ts")],
    });

    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.totalChecks).toBeGreaterThan(0);
  });
});
