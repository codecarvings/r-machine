import { readFileSync } from "node:fs";
import { parse } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CLI_VERSION, findPackageVersion } from "../src/cli/version.js";

describe("CLI version", () => {
  it("reads the version from the package's own package.json", () => {
    const { version } = JSON.parse(
      readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8")
    ) as { version: string };

    expect(version).toMatch(/^\d+\.\d+\.\d+/);
    expect(CLI_VERSION).toBe(version);
    expect(findPackageVersion()).toBe(version);
  });

  it("throws when no package.json is found up to the filesystem root", () => {
    // The filesystem root has no package.json, so the walk-up reaches the top
    // (parent === dir) and throws — the defensive guard for an impossible state.
    const fsRoot = parse(process.cwd()).root;
    expect(() => findPackageVersion(fsRoot)).toThrow(/could not locate package\.json/);
  });
});
