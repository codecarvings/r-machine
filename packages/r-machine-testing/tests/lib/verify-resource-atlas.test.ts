import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import nodePath from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { verifyResourceAtlas } from "../../src/lib/verify-resource-atlas.js";

const FORCE_DEV_LOADER_FLAG = Symbol.for("@r-machine:force-dev-loader");

const FIXTURE_DIR = nodePath.resolve(__dirname, "../fixtures/verify-resource-atlas");
const fixture = (name: string) => nodePath.join(FIXTURE_DIR, name);
const ATLAS_FILE = fixture("resource-atlas.ts");

// Temp directories created by tests that need a tsconfig-less tree; removed
// after each test so the temp area stays clean.
const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

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

    it("accepts a file: URL string (anchored to the test file via import.meta.resolve)", async () => {
      const report = await verifyResourceAtlas(pathToFileURL(fixture("ok-setup.ts")).href);

      expect(report.ok).toBe(true);
      expect(report.setupFile).toBe(fixture("ok-setup.ts"));
    });

    it("accepts a URL object", async () => {
      const report = await verifyResourceAtlas(pathToFileURL(fixture("ok-setup.ts")));

      expect(report.ok).toBe(true);
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
      if (issue.kind !== "loader-error") {
        return;
      }
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
      if (issue.kind !== "invalid-module-shape") {
        return;
      }
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
      if (hint?.kind !== "dev-loader-not-active") {
        return;
      }
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

    it("fires when the located ResourceAtlas class has no `shape` (not from defineLayout)", async () => {
      const report = await verifyResourceAtlas(fixture("no-shape-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0]).toMatchObject({ kind: "atlas-extraction-failed" });
      expect(report.issues[0].kind === "atlas-extraction-failed" && report.issues[0].reason).toMatch(
        /no "shape" property/i
      );
    });

    it("follows a cyclic import graph without looping (visited guard) and still reports failure", async () => {
      // cyclic-setup → cyclic-a → cyclic-b → cyclic-a (already visited). No
      // ResourceAtlas anywhere, so extraction fails cleanly instead of looping.
      const report = await verifyResourceAtlas(fixture("cyclic-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues[0]).toMatchObject({ kind: "atlas-extraction-failed" });
    });

    it("skips an import that does not resolve to a source file", async () => {
      // The setup imports `./does-not-exist.js`, which has no resolvable source —
      // the import-graph walk skips it and ends with no ResourceAtlas found.
      const report = await verifyResourceAtlas(fixture("missing-import-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues[0]).toMatchObject({ kind: "atlas-extraction-failed" });
    });
  });

  describe("config-access-failed", () => {
    it("surfaces a non-Error thrown during the setup import via String() coercion", async () => {
      // The setup throws a raw string at module top-level; the runtime import
      // rejects with it and `errorMessage` coerces the non-Error to a string.
      const report = await verifyResourceAtlas(fixture("throw-string-toplevel-setup.ts"));

      expect(report.ok).toBe(false);
      expect(report.issues).toHaveLength(1);
      expect(report.issues[0]).toMatchObject({ kind: "config-access-failed" });
      expect(report.issues[0].kind === "config-access-failed" && report.issues[0].reason).toBe(
        "non-error top-level failure"
      );
    });
  });

  describe("serializeError variants", () => {
    it("serializes a non-Error loader throw and a degenerate (no-name/no-stack) Error", async () => {
      const report = await verifyResourceAtlas(fixture("serialize-variants-setup.ts"));

      expect(report.ok).toBe(false);
      const errors = report.issues
        .filter((i): i is Extract<typeof i, { kind: "loader-error" }> => i.kind === "loader-error")
        .map((i) => i.error);

      // Non-Error throw → UnknownError + String(value).
      expect(errors).toContainEqual({ name: "UnknownError", message: "raw string failure" });
      // Empty-name Error → name falls back to "Error"; deleted stack → omitted.
      const degenerate = errors.find((e) => e.message === "degenerate error");
      expect(degenerate?.name).toBe("Error");
      expect(degenerate && "stack" in degenerate).toBe(false);
    });
  });

  describe("readCompilerOptions edge cases", () => {
    it("honors an explicit `tsconfig` option (tolerating a degenerate config)", async () => {
      // Exercises the explicit-tsconfig path (vs. the auto findConfigFile walk).
      // The file's JSON root is `null`; TS reads it as an empty config, and
      // extraction still completes against the ok setup.
      const report = await verifyResourceAtlas(fixture("ok-setup.ts"), {
        tsconfig: fixture("bad-tsconfig.json"),
      });
      expect(report.setupFile).toBe(fixture("ok-setup.ts"));
    });

    it("falls back to default options when no tsconfig is found near the setup file", async () => {
      // A setup file in a tsconfig-less temp tree: findConfigFile returns
      // nothing → default compiler options. Extraction can't resolve the atlas
      // there, so it reports a clean extraction failure (no crash).
      const dir = mkdtempSync(nodePath.join(tmpdir(), "rm-verify-notsconfig-"));
      tempDirs.push(dir);
      const setup = nodePath.join(dir, "setup.ts");
      writeFileSync(setup, "export const strategy = {};\n");

      const report = await verifyResourceAtlas(setup);
      expect(report.setupFile).toBe(setup);
      expect(report.ok).toBe(false);
      expect(report.issues[0]).toMatchObject({ kind: "atlas-extraction-failed" });
    });
  });

  describe("force-dev-loader refcount", () => {
    afterEach(() => {
      delete (globalThis as Record<symbol, unknown>)[FORCE_DEV_LOADER_FLAG];
    });

    it("decrements (without deleting) when another holder still owns the flag", async () => {
      // Pre-seed the ref-counted flag as if a concurrent verify already acquired
      // it: this call's release decrements 2→1 (the else branch) instead of
      // deleting, leaving the outstanding holder's count intact.
      (globalThis as Record<symbol, number>)[FORCE_DEV_LOADER_FLAG] = 1;

      await verifyResourceAtlas(fixture("ok-setup.ts"));

      expect((globalThis as Record<symbol, number>)[FORCE_DEV_LOADER_FLAG]).toBe(1);
    });
  });
});
