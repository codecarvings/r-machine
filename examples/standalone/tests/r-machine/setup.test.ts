import { verifyResourceAtlas } from "@r-machine/testing";

// Static + runtime check: every namespace declared in the ResourceAtlas resolves
// through the configured loader (and shells have all locale variants). Works
// standalone — no framework strategy involved.
describe("R-Machine resource atlas", () => {
  it("every declared resource resolves through the configured loader", async () => {
    // Standalone has no strategy, so point verifyResourceAtlas at the exported
    // `rMachine` instance directly.
    const report = await verifyResourceAtlas(import.meta.resolve("../../src/r-machine/setup.ts"), {
      strategyExportName: "rMachine",
    });

    expect(report.issues).toEqual([]);
    expect(report.totalChecks).toBeGreaterThan(0);
  });
});
