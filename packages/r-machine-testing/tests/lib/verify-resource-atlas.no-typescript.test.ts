import nodePath from "node:path";
import { describe, expect, it, vi } from "vitest";

// Simulate the `typescript` peer dependency being absent: the dynamic
// `import("typescript")` inside `loadTypeScript` rejects, so `verifyResourceAtlas`
// must surface a clear "install typescript" message as an atlas-extraction
// failure rather than crashing. Isolated in its own file because the mock must
// be in effect before the module under test pulls TypeScript in.
vi.mock("typescript", () => {
  throw new Error("Cannot find module 'typescript'");
});

const { verifyResourceAtlas } = await import("../../src/lib/verify-resource-atlas.js");

const fixture = (name: string) => nodePath.resolve(__dirname, "../fixtures/verify-resource-atlas", name);

describe("verifyResourceAtlas without the typescript peer dependency", () => {
  it("reports atlas-extraction-failed with an install hint", async () => {
    const report = await verifyResourceAtlas(fixture("ok-setup.ts"));

    expect(report.ok).toBe(false);
    expect(report.issues).toHaveLength(1);
    expect(report.issues[0]).toMatchObject({ kind: "atlas-extraction-failed" });
    expect(report.issues[0].kind === "atlas-extraction-failed" && report.issues[0].reason).toMatch(
      /requires the "typescript" package/i
    );
  });
});
