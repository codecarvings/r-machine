import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_OUT, installSkill, locateBundledSkill, SKILL_NAME, skillCommand } from "../src/cli/commands/skill.js";

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
const runSkill = (args: { out?: string; force?: boolean }): Promise<void> =>
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

describe("locateBundledSkill", () => {
  it("finds the bundled Skill containing SKILL.md", async () => {
    const dir = await locateBundledSkill();
    expect(await exists(join(dir, "SKILL.md"))).toBe(true);
    expect(await exists(join(dir, "references", "patterns.md"))).toBe(true);
  });

  it("throws once the walk reaches the filesystem root without finding a Skill", async () => {
    // Start from an empty temp tree: no `skill/SKILL.md` exists up to the root.
    await expect(locateBundledSkill(cwd)).rejects.toThrow(/could not locate the bundled R-Machine Skill/);
  });
});

describe("installSkill", () => {
  it("installs into <cwd>/.claude/skills/r-machine by default", async () => {
    const result = await installSkill({ cwd });

    expect(result.status).toBe("installed");
    expect(result.dest).toBe(join(cwd, ".claude", "skills", SKILL_NAME));
    // DEFAULT_OUT drives the default destination.
    expect(result.dest.startsWith(join(cwd, ...DEFAULT_OUT.split("/")))).toBe(true);
  });

  it("copies SKILL.md and the references folder", async () => {
    const { dest, files } = await installSkill({ cwd });

    expect(files).toContain("SKILL.md");
    expect(files).toContain(join("references", "patterns.md"));
    expect(files).toContain(join("references", "next-setup.md"));
    expect(files).toContain(join("references", "react-setup.md"));
    expect(await exists(join(dest, "SKILL.md"))).toBe(true);
  });

  it("honours a custom out directory", async () => {
    const result = await installSkill({ cwd, out: "tools/agent-skills" });
    expect(result.dest).toBe(join(cwd, "tools", "agent-skills", SKILL_NAME));
    expect(await exists(join(result.dest, "SKILL.md"))).toBe(true);
  });

  it("refuses to overwrite an existing destination without force", async () => {
    const first = await installSkill({ cwd });
    const sentinel = join(first.dest, "SENTINEL.txt");
    await writeFile(sentinel, "user content");

    const second = await installSkill({ cwd });

    expect(second.status).toBe("exists");
    expect(second.files).toEqual([]);
    // Nothing was written — the user's file is untouched.
    expect(await readFile(sentinel, "utf8")).toBe("user content");
  });

  it("overwrites an existing destination when force is set", async () => {
    const first = await installSkill({ cwd });
    const sentinel = join(first.dest, "SENTINEL.txt");
    await writeFile(sentinel, "stale");

    const second = await installSkill({ cwd, force: true });

    expect(second.status).toBe("installed");
    // The overwrite is a clean replace — the stray file is gone.
    expect(await exists(sentinel)).toBe(false);
    expect(await exists(join(second.dest, "SKILL.md"))).toBe(true);
  });
});

describe("skillCommand.run", () => {
  // run() reads process.cwd() (not an option), so each test runs inside the
  // temp cwd. isTTY / exitCode are process-global; save and restore them.
  let prevCwd: string;
  let prevTTY: boolean | undefined;

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
    expect(await exists(join(cwd, ".claude", "skills", SKILL_NAME, "SKILL.md"))).toBe(true);
  });

  it("cancels with exit code 1 when the destination exists in a non-interactive session", async () => {
    await installSkill({ cwd }); // pre-create the destination
    process.stdout.isTTY = false;

    await runSkill({ out: undefined, force: false });

    expect(clack.cancel).toHaveBeenCalledOnce();
    expect(clack.confirm).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it("overwrites after the user confirms the interactive prompt", async () => {
    await installSkill({ cwd });
    const sentinel = join(cwd, ".claude", "skills", SKILL_NAME, "SENTINEL.txt");
    await writeFile(sentinel, "stale");
    process.stdout.isTTY = true;
    clack.confirm.mockResolvedValue(true);

    await runSkill({ out: undefined, force: false });

    expect(clack.confirm).toHaveBeenCalledOnce();
    expect(clack.log.success).toHaveBeenCalledOnce();
    expect(await exists(sentinel)).toBe(false); // clean overwrite
  });

  it("aborts without writing when the user declines the prompt", async () => {
    await installSkill({ cwd });
    process.stdout.isTTY = true;
    clack.confirm.mockResolvedValue(false);

    await runSkill({ out: undefined, force: false });

    expect(clack.cancel).toHaveBeenCalledWith(expect.stringMatching(/cancelled/i));
    expect(clack.log.success).not.toHaveBeenCalled();
  });

  it("aborts when the user cancels (Ctrl-C) the prompt", async () => {
    await installSkill({ cwd });
    process.stdout.isTTY = true;
    clack.confirm.mockResolvedValue(Symbol("cancel"));
    clack.isCancel.mockReturnValue(true);

    await runSkill({ out: undefined, force: false });

    expect(clack.cancel).toHaveBeenCalledWith(expect.stringMatching(/cancelled/i));
    expect(clack.log.success).not.toHaveBeenCalled();
  });

  it("falls back to the absolute path when the destination equals the cwd (exists branch)", async () => {
    // `rforge skill --out ..` from inside a folder literally named `r-machine`:
    // dest resolves back to the cwd, so relative() is "" and the code uses the
    // absolute dest. Mock cwd to that degenerate location.
    const rDir = join(cwd, SKILL_NAME);
    await mkdir(rDir); // pre-exists → "exists" status
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
    // fails with ENOTDIR, surfacing through the command's catch.
    const outFile = join(cwd, "blocked");
    await writeFile(outFile, "not a directory");

    await runSkill({ out: "blocked", force: false });

    expect(clack.cancel).toHaveBeenCalledWith(expect.stringMatching(/Installation failed/i));
    expect(process.exitCode).toBe(1);
  });
});
