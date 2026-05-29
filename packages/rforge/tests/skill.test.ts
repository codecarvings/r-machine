import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_OUT, installSkill, locateBundledSkill, SKILL_NAME } from "../src/cli/commands/skill.js";

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
