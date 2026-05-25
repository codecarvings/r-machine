import { verifyResourceAtlas } from "@r-machine/testing";
import { describe, expect, it } from "vitest";

describe("setup.ts ResourceAtlas", () => {
  it("every declared atlas key resolves for every locale", async () => {
    const report = await verifyResourceAtlas("./src/r-machine/setup.ts");

    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.totalChecks).toBeGreaterThan(0);
  });
});
