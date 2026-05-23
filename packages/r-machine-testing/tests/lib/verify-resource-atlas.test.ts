import nodePath from "node:path";
import { describe, expect, it } from "vitest";
import { verifyResourceAtlas } from "../../src/lib/verify-resource-atlas.js";

const FIXTURE_DIR = nodePath.resolve(__dirname, "../fixtures/verify-resource-atlas");
const fixture = (name: string) => nodePath.join(FIXTURE_DIR, name);
const ATLAS_FILE = fixture("resource-atlas.ts");

describe("verifyResourceAtlas", () => {
  describe("happy path", () => {
    it("returns ok with no issues when every key resolves", async () => {
      const report = await verifyResourceAtlas(fixture("ok-setup.ts"));

      expect(report.ok).toBe(true);
      expect(report.issues).toEqual([]);
      // gear (1) + shell × 2 locales (2) + shell(mono) (1) + #internal shell × 2 locales (2) = 6
      expect(report.totalChecks).toBe(6);
    });

    it("returns an absolute setupFile path", async () => {
      const report = await verifyResourceAtlas(fixture("ok-setup.ts"));
      expect(nodePath.isAbsolute(report.setupFile)).toBe(true);
      expect(report.setupFile).toBe(fixture("ok-setup.ts"));
    });
  });

  describe("missing-resource", () => {
    it("reports an issue with locale and isCanonical: false for a missing translation", async () => {
      const report = await verifyResourceAtlas(fixture("missing-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues).toHaveLength(1);

      const issue = report.issues[0];
      expect(issue).toMatchObject({
        kind: "missing-resource",
        key: "shell/multi",
        locale: "it",
        isCanonical: false,
      });
      expect(issue.kind === "missing-resource" && issue.sourceLocation?.file).toBe(ATLAS_FILE);
    });
  });

  describe("loader-error", () => {
    it("captures the thrown error and preserves the original message", async () => {
      const report = await verifyResourceAtlas(fixture("throws-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues).toHaveLength(1);

      const issue = report.issues[0];
      expect(issue.kind).toBe("loader-error");
      if (issue.kind !== "loader-error") return;
      expect(issue.key).toBe("gear/inner");
      // Non-shell kinds: no locale, no isCanonical.
      expect(issue.locale).toBeUndefined();
      expect(issue.isCanonical).toBeUndefined();
      expect(issue.error.message).toBe("synthetic loader failure");
      expect(issue.error.name).toBe("Error");
      expect(issue.sourceLocation?.file).toBe(ATLAS_FILE);
    });
  });

  describe("invalid-module-shape", () => {
    it("flags a module that lacks the `r` property", async () => {
      const report = await verifyResourceAtlas(fixture("bad-shape-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues).toHaveLength(1);

      const issue = report.issues[0];
      expect(issue.kind).toBe("invalid-module-shape");
      if (issue.kind !== "invalid-module-shape") return;
      expect(issue.key).toBe("shell/lib/mono");
      // shell(mono) is checked against defaultLocale only.
      expect(issue.locale).toBe("en");
      expect(issue.isCanonical).toBe(true);
      expect(issue.reason).toMatch(/missing required property "r"/i);
    });
  });

  describe("layout-kind dispatch", () => {
    it("uses 1 check for gear:inner, 2 checks per shell, 1 check for shell(mono)", async () => {
      // Re-verifies the ok path with a deliberate accounting cross-check —
      // documents the dispatch table.
      const report = await verifyResourceAtlas(fixture("ok-setup.ts"));
      const expectedChecks = 1 + 2 + 1 + 2; // gear + shell×2 + mono + #internal shell×2
      expect(report.totalChecks).toBe(expectedChecks);
    });
  });

  describe("internal namespaces (`#` prefix)", () => {
    it("strips `#` before invoking resolver/loader but preserves it in the issue key", async () => {
      const report = await verifyResourceAtlas(fixture("internal-missing-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues).toHaveLength(1);

      const issue = report.issues[0];
      expect(issue).toMatchObject({
        kind: "missing-resource",
        // Issue key keeps the user-facing `#` — matches what they declared.
        key: "#shell/internal",
        locale: "it",
        isCanonical: false,
      });
    });
  });

  describe("strategyExportName option", () => {
    it("uses the default 'strategy' export and fails when the named export is missing", async () => {
      const report = await verifyResourceAtlas(fixture("custom-export-setup.ts"));
      expect(report.ok).toBe(false);
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0].kind).toBe("config-access-failed");
    });

    it("honors a custom strategyExportName", async () => {
      const report = await verifyResourceAtlas(fixture("custom-export-setup.ts"), {
        strategyExportName: "myStrategy",
      });
      expect(report.ok).toBe(true);
      expect(report.issues).toEqual([]);
    });
  });

  describe("config-access-failed", () => {
    it("fires when the strategy export does not implement CONFIG_ACCESSOR", async () => {
      const report = await verifyResourceAtlas(fixture("bad-strategy-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0]).toMatchObject({
        kind: "config-access-failed",
      });
    });
  });

  describe("dev-loader-not-active hint", () => {
    it("appends the hint when a Next setup is detected and the dev loader did NOT activate", async () => {
      const report = await verifyResourceAtlas(fixture("dev-loader-missing-setup.ts"));

      expect(report.ok).toBe(false);

      // The loader fails for every key, producing many loader-error issues
      // plus the hint at the end.
      const hint = report.issues.find((i) => i.kind === "dev-loader-not-active");
      expect(hint).toBeDefined();
      if (hint?.kind !== "dev-loader-not-active") return;
      expect(hint.reason).toMatch(/jiti/i);
      expect(hint.reason).toMatch(/pnpm add -D jiti/i);
    });

    it("does NOT append the hint when the dev loader is active (errors are real bugs)", async () => {
      const report = await verifyResourceAtlas(fixture("dev-loader-active-setup.ts"));

      // Loader fails → there are issues, but no hint should be appended.
      expect(report.ok).toBe(false);
      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues.some((i) => i.kind === "dev-loader-not-active")).toBe(false);
    });

    it("does NOT append the hint when there is no Next involvement at all", async () => {
      // throws-setup is a plain RMachine setup, never invokes createNextDevImport.
      const report = await verifyResourceAtlas(fixture("throws-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues.some((i) => i.kind === "dev-loader-not-active")).toBe(false);
    });
  });

  describe("atlas-extraction-failed", () => {
    it("fires when no ResourceAtlas class is reachable from the setup file", async () => {
      const report = await verifyResourceAtlas(fixture("no-atlas-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0]).toMatchObject({
        kind: "atlas-extraction-failed",
      });
      // Fatal failures stop before the verification phase runs.
      expect(report.totalChecks).toBe(0);
    });
  });
});
