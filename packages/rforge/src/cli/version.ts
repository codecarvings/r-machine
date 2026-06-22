import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Read the CLI version from the package's own package.json at runtime. A
// find-up (rather than a fixed relative import) is required because the build
// flattens `src/` into the package root (tsconfig `outDir: "."`), so the depth
// to package.json differs between source (`src/cli/`) and built output (`cli/`)
// — in both, and once installed, the first package.json found walking up is
// rforge's own.
export function findPackageVersion(startDir = dirname(fileURLToPath(import.meta.url))): string {
  let dir = startDir;
  for (;;) {
    try {
      return (JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as { version: string }).version;
    } catch {
      const parent = dirname(dir);
      if (parent === dir) {
        throw new Error("rforge: could not locate package.json to read the CLI version.");
      }
      dir = parent;
    }
  }
}

export const CLI_VERSION = findPackageVersion();
