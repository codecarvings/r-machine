/**
 * Copyright (c) 2026 Sergio Turolla
 *
 * This file is part of r-machine, licensed under the
 * GNU Affero General Public License v3.0 (AGPL-3.0-only).
 *
 * You may use, modify, and distribute this file under the terms
 * of the AGPL-3.0. See LICENSE in this package for details.
 *
 * If you need to use this software in a proprietary project,
 * contact: licensing@codecarvings.com
 */

import { access, cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cancel, confirm, intro, isCancel, log, outro } from "@clack/prompts";
import { defineCommand } from "citty";
import pc from "picocolors";

/** Folder name created inside the target skills directory. */
export const SKILL_NAME = "r-machine";
/** Default destination, relative to the current working directory. */
export const DEFAULT_OUT = "./.claude/skills";

export interface InstallSkillOptions {
  /** Skills directory to install into. Defaults to {@link DEFAULT_OUT}. */
  out?: string | undefined;
  /** Overwrite an existing destination. */
  force?: boolean | undefined;
  /** Base directory the `out` path is resolved against. Defaults to `process.cwd()`. */
  cwd?: string | undefined;
}

export interface InstallSkillResult {
  /** `"installed"` if files were written; `"exists"` if the destination already exists and `force` was not set. */
  status: "installed" | "exists";
  /** Absolute path of the installed Skill folder. */
  dest: string;
  /** Files written, relative to `dest`. Empty when `status` is `"exists"`. */
  files: string[];
}

/**
 * Locate the Skill bundled inside this package.
 *
 * The compiled command lives at `lib/commands/skill.js`, but in dev (tsx) and
 * tests it runs from `src/lib/commands/skill.ts` — a different depth. Rather
 * than hard-coding `../../`, walk up from the current module until a
 * `skill/SKILL.md` is found. This works for both the published package and the
 * source tree.
 */
export async function locateBundledSkill(): Promise<string> {
  let dir = dirname(fileURLToPath(import.meta.url));

  for (;;) {
    const candidate = join(dir, "skill");
    try {
      await access(join(candidate, "SKILL.md"));
      return candidate;
    } catch {
      // not here — keep walking up
    }
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error("could not locate the bundled R-Machine Skill inside the rforge package.");
    }
    dir = parent;
  }
}

/** Collect every file under `dir`, as paths relative to `dir`, sorted. */
async function listFiles(dir: string, base = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(full, base)));
    } else {
      files.push(relative(base, full));
    }
  }
  return files.sort();
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy the bundled Skill into `<out>/r-machine`.
 *
 * Pure of any CLI/prompt concerns so it can be driven from tests or other
 * tooling. Returns `status: "exists"` (without writing) when the destination is
 * present and `force` is not set — callers decide how to confirm overwrites.
 */
export async function installSkill(opts: InstallSkillOptions = {}): Promise<InstallSkillResult> {
  const cwd = opts.cwd ?? process.cwd();
  const skillsDir = resolve(cwd, opts.out ?? DEFAULT_OUT);
  const dest = join(skillsDir, SKILL_NAME);

  if (!opts.force && (await pathExists(dest))) {
    return { status: "exists", dest, files: [] };
  }

  const source = await locateBundledSkill();
  await rm(dest, { recursive: true, force: true });
  await mkdir(skillsDir, { recursive: true });
  await cp(source, dest, { recursive: true });

  return { status: "installed", dest, files: await listFiles(dest) };
}

export const skillCommand = defineCommand({
  meta: {
    name: "skill",
    description: "Install the R-Machine LLM-agent Skill into the target project.",
  },
  args: {
    out: {
      type: "string",
      description: `Skills directory to install into (defaults to ${DEFAULT_OUT}).`,
      required: false,
    },
    force: {
      type: "boolean",
      description: "Overwrite the Skill if it already exists at the destination.",
      default: false,
    },
  },
  async run({ args }) {
    intro(pc.redBright("R-Machine") + pc.dim(" : ") + pc.whiteBright("skill"));

    const report = (result: InstallSkillResult) => {
      const prettyDest = relative(process.cwd(), result.dest) || result.dest;
      log.success(pc.green(`Installed the R-Machine Skill to ${pc.bold(prettyDest)}`));
      log.message(result.files.map((f) => pc.dim("  • ") + f).join("\n"));
      outro(
        `The agent will now pick up the Skill from ${pc.bold(prettyDest)}.\n` +
          pc.dim("  Commit it to share with your team, or re-run with --force to refresh.")
      );
    };

    try {
      const first = await installSkill({ out: args.out, force: args.force });
      if (first.status === "installed") {
        report(first);
        return;
      }

      const prettyDest = relative(process.cwd(), first.dest) || first.dest;

      // Destination exists and --force was not passed.
      if (!process.stdout.isTTY) {
        // Non-interactive (CI, piped) sessions cannot be prompted.
        cancel(pc.red(`"${prettyDest}" already exists. Re-run with `) + pc.bold("--force") + pc.red(" to overwrite."));
        process.exitCode = 1;
        return;
      }

      const proceed = await confirm({ message: `"${prettyDest}" already exists. Overwrite it?`, initialValue: false });
      if (isCancel(proceed) || !proceed) {
        cancel("Installation cancelled — nothing was written.");
        return;
      }

      report(await installSkill({ out: args.out, force: true }));
    } catch (err) {
      cancel(pc.red(`Installation failed: ${(err as Error).message}`));
      process.exitCode = 1;
    }
  },
});
