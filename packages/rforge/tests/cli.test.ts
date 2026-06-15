import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { printBanner } from "../src/cli/banner.js";
import { CLI_NAME, main } from "../src/cli/index.js";
import { CLI_VERSION } from "../src/cli/version.js";

// `runMain` actually starts the process-level CLI loop; stub it so importing the
// `bin` entrypoint is a no-op. `defineCommand` is kept real so the command tree
// still builds.
const { runMain } = vi.hoisted(() => ({ runMain: vi.fn() }));
vi.mock("citty", async (importOriginal) => {
  const actual = await importOriginal<typeof import("citty")>();
  return { ...actual, runMain };
});

describe("printBanner", () => {
  it("writes the R-Machine : Forge banner to stdout", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    printBanner();
    expect(log).toHaveBeenCalledOnce();
    const output = log.mock.calls[0]?.[0] as string;
    expect(output).toContain("R-MACHINE");
    expect(output).toContain("FORGE");
    log.mockRestore();
  });
});

describe("main command", () => {
  it("is named rforge, carries the version, and exposes the skill subcommand", () => {
    expect(CLI_NAME).toBe("rforge");
    expect(main.meta).toMatchObject({ name: CLI_NAME, version: CLI_VERSION });
    expect(main.subCommands).toHaveProperty("skill");
    expect(typeof CLI_VERSION).toBe("string");
  });
});

describe("bin entrypoint", () => {
  let savedArgv: string[];

  beforeEach(() => {
    savedArgv = process.argv;
    runMain.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    process.argv = savedArgv;
  });

  it("prints the banner when invoked with no arguments, then runs the CLI", async () => {
    process.argv = ["node", "rforge"];
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/bin.js");

    expect(log).toHaveBeenCalled(); // banner emitted
    expect(runMain).toHaveBeenCalledOnce();
    log.mockRestore();
  });

  it("skips the banner when a subcommand is passed", async () => {
    process.argv = ["node", "rforge", "skill"];
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/bin.js");

    expect(log).not.toHaveBeenCalled(); // no banner
    expect(runMain).toHaveBeenCalledOnce();
    log.mockRestore();
  });
});
