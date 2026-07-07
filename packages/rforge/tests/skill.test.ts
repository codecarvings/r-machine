import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_TARGETS,
  installSkill,
  locateBundledSkill,
  MANIFEST_NAME,
  SKILL_NAME,
  skillCommand,
} from "../src/cli/commands/skill.js";

// The command's `run` drives @clack/prompts; mock them so the interactive
// branches are observable without a real TTY.
const clack = vi.hoisted(() => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
  log: { success: vi.fn(), message: vi.fn() },
}));
vi.mock("@clack/prompts", () => clack);

// citty's `run` receives a full command context; the command only reads `args`.
const runSkill = (args: { out?: string | undefined; force?: boolean }): Promise<void> =>
  (skillCommand.run as (ctx: { args: typeof args }) => Promise<void>)({ args });

let cwd: string;

beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), "rforge-skill-"));
});

afterEach(async () => {
  await rm(cwd, { recursive: true, force: true });
});

const exists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

/** Absolute path of an installed Skill folder under `<cwd>/<skillsDir>/r-machine`. */
const destIn = (skillsDir: string): string => join(cwd, ...skillsDir.replace(/^\.\//, "").split("/"), SKILL_NAME);
const CLAUDE = ".claude/skills";
const AGENTS = ".agents/skills";

const readManifest = async (dest: string): Promise<Record<string, unknown>> =>
  JSON.parse(await readFile(join(dest, MANIFEST_NAME), "utf8"));

/** Corrupt a destination's recorded source hash so it reads as stale. */
const makeStale = async (dest: string): Promise<void> => {
  const m = await readManifest(dest);
  m.sourceHash = "sha256:0000000000000000000000000000000000000000000000000000000000000000";
  await writeFile(join(dest, MANIFEST_NAME), JSON.stringify(m));
};

describe("locateBundledSkill", () => {
  it("finds the bundled Skill containing SKILL.md", async () => {
    const dir = await locateBundledSkill();
    expect(await exists(join(dir, "SKILL.md"))).toBe(true);
    expect(await exists(join(dir, "references", "next-setup.md"))).toBe(true);
    expect(await exists(join(dir, "references", "patterns", "outer.md"))).toBe(true);
  });

  it("throws once the walk reaches the filesystem root without finding a Skill", async () => {
    // Start from an empty temp tree: no `skill/SKILL.md` exists up to the root.
    await expect(locateBundledSkill(cwd)).rejects.toThrow(/could not locate the bundled R-Machine Skill/);
  });
});

describe("installSkill", () => {
  it("seeds both default targets on a fresh install", async () => {
    const result = await installSkill({ cwd });

    expect(result.status).toBe("installed");
    expect(result.targets).toHaveLength(DEFAULT_TARGETS.length);
    const dests = result.targets.map((t) => t.dest);
    expect(dests).toContain(destIn(CLAUDE));
    expect(dests).toContain(destIn(AGENTS));
    expect(result.targets.every((t) => t.written)).toBe(true);
    expect(await exists(join(destIn(CLAUDE), "SKILL.md"))).toBe(true);
    expect(await exists(join(destIn(AGENTS), "SKILL.md"))).toBe(true);
  });

  it("copies SKILL.md and the references folder (incl. nested patterns)", async () => {
    const result = await installSkill({ cwd });
    const target = result.targets.find((t) => t.dest === destIn(CLAUDE));

    expect(target).toBeDefined();
    expect(target?.files).toContain("SKILL.md");
    expect(target?.files).toContain(join("references", "next-setup.md"));
    expect(target?.files).toContain(join("references", "react-setup.md"));
    // the split is copied recursively — nested family + consume files land too:
    expect(target?.files).toContain(join("references", "patterns", "outer.md"));
    expect(target?.files).toContain(join("references", "patterns", "consume", "plug.md"));
  });

  it("writes a manifest recording the rforge version and a source hash", async () => {
    await installSkill({ cwd });
    const manifest = await readManifest(destIn(CLAUDE));

    expect(manifest.skill).toBe(SKILL_NAME);
    expect(typeof manifest.rforgeVersion).toBe("string");
    expect(manifest.sourceHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(typeof manifest.installedAt).toBe("string");
  });

  it("honours a single explicit out directory (bypasses the multi-target policy)", async () => {
    const result = await installSkill({ cwd, out: "tools/agent-skills" });

    expect(result.targets).toHaveLength(1);
    expect(result.targets[0]?.dest).toBe(join(cwd, "tools", "agent-skills", SKILL_NAME));
    expect(await exists(join(cwd, ".agents"))).toBe(false); // policy bypassed
  });

  it("reports up-to-date and writes nothing when every target already matches", async () => {
    await installSkill({ cwd });
    const sentinel = join(destIn(CLAUDE), "SENTINEL.txt");
    await writeFile(sentinel, "user content");

    const second = await installSkill({ cwd });

    expect(second.status).toBe("up-to-date");
    expect(second.targets.every((t) => !t.written)).toBe(true);
    // Nothing was rewritten — the user's file is untouched.
    expect(await readFile(sentinel, "utf8")).toBe("user content");
  });

  it("updates only the location that already has the Skill (never resurrects a removed one)", async () => {
    // Seed only .claude, then run the default policy.
    await installSkill({ cwd, out: CLAUDE });
    const result = await installSkill({ cwd });

    const dests = result.targets.map((t) => t.dest);
    expect(dests).toContain(destIn(CLAUDE));
    expect(dests).not.toContain(destIn(AGENTS));
    expect(await exists(join(cwd, ".agents"))).toBe(false);
  });

  it("reports stale (without writing) when a target's recorded hash no longer matches", async () => {
    await installSkill({ cwd });
    await makeStale(destIn(CLAUDE));

    const result = await installSkill({ cwd });
    const claude = result.targets.find((t) => t.dest === destIn(CLAUDE));

    expect(result.status).toBe("stale");
    expect(claude?.state).toBe("stale");
    expect(claude?.written).toBe(false);
  });

  it("refreshes every target when force is set", async () => {
    await installSkill({ cwd });
    const sentinel = join(destIn(CLAUDE), "SENTINEL.txt");
    await writeFile(sentinel, "stale");

    const result = await installSkill({ cwd, force: true });

    expect(result.status).toBe("installed");
    expect(result.targets.every((t) => t.written)).toBe(true);
    // The overwrite is a clean replace — the stray file is gone.
    expect(await exists(sentinel)).toBe(false);
    expect(await exists(join(destIn(CLAUDE), "SKILL.md"))).toBe(true);
  });
});

describe("skillCommand.run", () => {
  // run() reads process.cwd() (not an option), so each test runs inside the
  // temp cwd. isTTY / exitCode are process-global; save and restore them.
  let prevCwd: string;
  let prevTTY: boolean;

  beforeEach(() => {
    prevCwd = process.cwd();
    prevTTY = process.stdout.isTTY;
    process.chdir(cwd);
    process.exitCode = undefined;
    vi.clearAllMocks();
    clack.isCancel.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks(); // drop any process.cwd spy
    process.chdir(prevCwd);
    process.stdout.isTTY = prevTTY;
    process.exitCode = undefined;
  });

  it("installs and reports success on a fresh destination", async () => {
    await runSkill({ out: undefined, force: false });

    expect(clack.intro).toHaveBeenCalledOnce();
    expect(clack.log.success).toHaveBeenCalledOnce();
    expect(clack.outro).toHaveBeenCalledOnce();
    expect(clack.cancel).not.toHaveBeenCalled();
    expect(await exists(join(destIn(CLAUDE), "SKILL.md"))).toBe(true);
    expect(await exists(join(destIn(AGENTS), "SKILL.md"))).toBe(true);
  });

  it("reports up-to-date without a prompt when nothing changed", async () => {
    await installSkill({ cwd }); // pre-install both targets, current

    await runSkill({ out: undefined, force: false });

    expect(clack.outro).toHaveBeenCalledWith(expect.stringMatching(/up to date/i));
    expect(clack.confirm).not.toHaveBeenCalled();
    expect(clack.cancel).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it("cancels with exit code 1 when an update is available in a non-interactive session", async () => {
    await installSkill({ cwd });
    await makeStale(destIn(CLAUDE));
    process.stdout.isTTY = false;

    await runSkill({ out: undefined, force: false });

    expect(clack.cancel).toHaveBeenCalledOnce();
    expect(clack.confirm).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it("updates after the user confirms the interactive prompt", async () => {
    await installSkill({ cwd });
    const sentinel = join(destIn(CLAUDE), "SENTINEL.txt");
    await writeFile(sentinel, "stale");
    await makeStale(destIn(CLAUDE));
    process.stdout.isTTY = true;
    clack.confirm.mockResolvedValue(true);

    await runSkill({ out: undefined, force: false });

    expect(clack.confirm).toHaveBeenCalledOnce();
    expect(clack.log.success).toHaveBeenCalledOnce();
    expect(await exists(sentinel)).toBe(false); // clean overwrite
  });

  it("aborts without writing when the user declines the prompt", async () => {
    await installSkill({ cwd });
    await makeStale(destIn(CLAUDE));
    process.stdout.isTTY = true;
    clack.confirm.mockResolvedValue(false);

    await runSkill({ out: undefined, force: false });

    expect(clack.cancel).toHaveBeenCalledWith(expect.stringMatching(/cancelled/i));
    expect(clack.log.success).not.toHaveBeenCalled();
  });

  it("aborts when the user cancels (Ctrl-C) the prompt", async () => {
    await installSkill({ cwd });
    await makeStale(destIn(CLAUDE));
    process.stdout.isTTY = true;
    clack.confirm.mockResolvedValue(Symbol("cancel"));
    clack.isCancel.mockReturnValue(true);

    await runSkill({ out: undefined, force: false });

    expect(clack.cancel).toHaveBeenCalledWith(expect.stringMatching(/cancelled/i));
    expect(clack.log.success).not.toHaveBeenCalled();
  });

  it("falls back to the absolute path when the destination equals the cwd (stale branch)", async () => {
    // `rforge skill --out ..` from inside a folder literally named `r-machine`:
    // dest resolves back to the cwd, so relative() is "" and the code uses the
    // absolute dest. A pre-existing folder with no manifest reads as stale.
    const rDir = join(cwd, SKILL_NAME);
    await mkdir(rDir);
    vi.spyOn(process, "cwd").mockReturnValue(rDir);
    process.stdout.isTTY = false;

    await runSkill({ out: "..", force: false });

    expect(clack.cancel).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(1);
  });

  it("falls back to the absolute path when the destination equals the cwd (report branch)", async () => {
    const rDir = join(cwd, SKILL_NAME);
    await mkdir(rDir);
    vi.spyOn(process, "cwd").mockReturnValue(rDir);

    await runSkill({ out: "..", force: true }); // installed → report()

    expect(clack.log.success).toHaveBeenCalledOnce();
    expect(await exists(join(rDir, "SKILL.md"))).toBe(true);
  });

  it("reports a failure and sets exit code 1 when installation throws", async () => {
    // Put a FILE where the skills directory should be: mkdir(skillsDir) then
    // fails with ENOTDIR/EEXIST, surfacing through the command's catch.
    const outFile = join(cwd, "blocked");
    await writeFile(outFile, "not a directory");

    await runSkill({ out: "blocked", force: false });

    expect(clack.cancel).toHaveBeenCalledWith(expect.stringMatching(/Installation failed/i));
    expect(process.exitCode).toBe(1);
  });
});
