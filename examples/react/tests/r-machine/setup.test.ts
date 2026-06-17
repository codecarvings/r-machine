import { verifyResourceAtlas } from "@r-machine/testing";

describe("R-Machine resource atlas", () => {
  it("every declared resource resolves through the configured loader", async () => {
    const report = await verifyResourceAtlas(import.meta.resolve("../../src/r-machine/setup.ts"));

    expect(report.issues).toEqual([]);
    expect(report.totalChecks).toBeGreaterThan(0);
  });
});
