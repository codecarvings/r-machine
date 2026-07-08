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

import { createHash } from "node:crypto";
import { access, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cancel, confirm, intro, isCancel, log, outro } from "@clack/prompts";
import { defineCommand } from "citty";
import pc from "picocolors";
import { CLI_VERSION } from "../version.js";

/** Folder name created inside each target skills directory. */
export const SKILL_NAME = "r-machine";
/**
 * Skills directories seeded on a first install, relative to the current working
 * directory. `.claude/skills` is Claude Code's location; `.agents/skills` is the
 * vendor-neutral location other agent tools read.
 */
export const DEFAULT_TARGETS = ["./.claude/skills", "./.agents/skills"] as const;
/** Primary default target — kept for messaging and backwards compatibility. */
export const DEFAULT_OUT = DEFAULT_TARGETS[0];
/** Manifest written into each installed Skill folder to track its provenance. */
export const MANIFEST_NAME = ".rforge-skill.json";

/** Provenance record written alongside an installed Skill. */
export interface SkillManifest {
  skill: string;
  /** rforge version that produced this install — a human-readable label. */
  rforgeVersion: string;
  /** Hash of the bundled Skill content at install time — the staleness signal. */
  sourceHash: string;
  installedAt: string;
}

export interface InstallSkillOptions {
  /**
   * A single explicit skills directory to install into. When set, the multi-target
   * policy is bypassed and only this location is touched. Defaults to the
   * {@link DEFAULT_TARGETS} policy.
   */
  out?: string | undefined;
  /** Overwrite/refresh every resolved target unconditionally. */
  force?: boolean | undefined;
  /** Base directory the `out`/targets are resolved against. Defaults to `process.cwd()`. */
  cwd?: string | undefined;
}

/** Whether an installed Skill is missing, matches the bundled one, or is out of date. */
export type TargetState = "absent" | "current" | "stale";

export interface TargetResult {
  /** The skills directory (the parent of the `r-machine` folder). */
  skillsDir: string;
  /** Absolute path of the installed Skill folder. */
  dest: string;
  /** State of the destination *before* this run acted on it. */
  state: TargetState;
  /** Whether files were written to this target during this run. */
  written: boolean;
  /** Files written, relative to `dest` (empty when `written` is `false`). */
  files: string[];
}

export interface InstallSkillResult {
  /**
   * - `"installed"` — files were written to at least one target.
   * - `"up-to-date"` — every resolved target already matched the bundled Skill; nothing written.
   * - `"stale"` — an update is available but was not written (no `force`); the caller decides.
   */
  status: "installed" | "up-to-date" | "stale";
  /** One entry per resolved target. */
  targets: TargetResult[];
}

/**
 * Locate the Skill bundled inside this package.
 *
 * The compiled command lives at `lib/commands/skill.js`, but in dev (tsx) and
 * tests it runs from `src/lib/commands/skill.ts` — a different depth. Rather
 * than hard-coding `../../`, walk up from the current module until a
 * `skill/SKILL.md` is found. This works for both the published package and the
 * source tree.
 *
 * `startDir` defaults to this module's directory; it is a seam for tests to
 * exercise the walk from an arbitrary location.
 */
export async function locateBundledSkill(startDir = dirname(fileURLToPath(import.meta.url))): Promise<string> {
  let dir = startDir;

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
 * Deterministic content hash of a Skill folder.
 *
 * Hashes the sorted files (path + bytes), excluding the manifest so a fresh
 * install and its recorded hash agree. The source is always read from the
 * package (LF line endings), so this is not exposed to `git autocrlf`
 * normalization — it identifies *which bundled Skill* a manifest came from.
 */
async function computeSkillHash(dir: string): Promise<string> {
  const files = (await listFiles(dir)).filter((f) => f !== MANIFEST_NAME);
  const hash = createHash("sha256");
  for (const rel of files) {
    hash.update(rel);
    hash.update("\0");
    hash.update(await readFile(join(dir, rel)));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

/** Read an installed Skill's manifest, or `null` if it is missing/unreadable. */
async function readManifest(dest: string): Promise<SkillManifest | null> {
  try {
    return JSON.parse(await readFile(join(dest, MANIFEST_NAME), "utf8")) as SkillManifest;
  } catch {
    return null;
  }
}

/** Classify a destination against the bundled Skill's hash. */
async function targetState(dest: string, sourceHash: string): Promise<TargetState> {
  if (!(await pathExists(dest))) {
    return "absent";
  }
  const manifest = await readManifest(dest);
  // A pre-existing folder with no (or an older) manifest reads as stale, so
  // installs from before manifests existed are offered an update rather than
  // silently skipped.
  return manifest?.sourceHash === sourceHash ? "current" : "stale";
}

/**
 * Resolve which skills directories this run acts on.
 *
 * - An explicit `out` bypasses the policy and targets exactly that directory.
 * - Otherwise: if the Skill is already present in any default target, act only on
 *   the present ones (never resurrect a location the user removed). If present in
 *   none, this is a first install — seed all defaults.
 */
async function resolveTargets(cwd: string, out?: string): Promise<string[]> {
  if (out) {
    return [resolve(cwd, out)];
  }

  const dirs = DEFAULT_TARGETS.map((t) => resolve(cwd, t));
  const present: string[] = [];
  for (const dir of dirs) {
    if (await pathExists(join(dir, SKILL_NAME))) {
      present.push(dir);
    }
  }
  return present.length > 0 ? present : dirs;
}

/** Copy the bundled Skill into `<skillsDir>/r-machine` and stamp its manifest. */
async function writeTarget(source: string, sourceHash: string, skillsDir: string): Promise<string[]> {
  const dest = join(skillsDir, SKILL_NAME);
  await rm(dest, { recursive: true, force: true });
  await mkdir(skillsDir, { recursive: true });
  await cp(source, dest, { recursive: true });

  const manifest: SkillManifest = {
    skill: SKILL_NAME,
    rforgeVersion: CLI_VERSION,
    sourceHash,
    installedAt: new Date().toISOString(),
  };
  await writeFile(join(dest, MANIFEST_NAME), `${JSON.stringify(manifest, null, 2)}\n`);

  return listFiles(dest);
}

/**
 * Install (or report the status of) the bundled Skill across the resolved targets.
 *
 * Pure of any CLI/prompt concerns so it can be driven from tests or other
 * tooling. Without `force`, an available update is *not* written — the result's
 * `status` is `"stale"` and the caller decides how to confirm it.
 */
export async function installSkill(opts: InstallSkillOptions = {}): Promise<InstallSkillResult> {
  const cwd = opts.cwd ?? process.cwd();
  const source = await locateBundledSkill();
  const sourceHash = await computeSkillHash(source);
  const skillsDirs = await resolveTargets(cwd, opts.out);

  const plan = await Promise.all(
    skillsDirs.map(async (skillsDir) => {
      const dest = join(skillsDir, SKILL_NAME);
      return { skillsDir, dest, state: await targetState(dest, sourceHash) };
    })
  );

  const allCurrent = plan.every((p) => p.state === "current");
  const anyStale = plan.some((p) => p.state === "stale");

  // Which targets to write this run:
  //  - force            → refresh everything in the set
  //  - all current      → nothing
  //  - an update exists  → nothing (needs the caller's consent)
  //  - otherwise         → the not-yet-current ones (a fresh install)
  const shouldWrite = (state: TargetState): boolean =>
    opts.force ? true : !allCurrent && !anyStale && state !== "current";

  const targets: TargetResult[] = [];
  for (const p of plan) {
    if (shouldWrite(p.state)) {
      const files = await writeTarget(source, sourceHash, p.skillsDir);
      targets.push({ ...p, written: true, files });
    } else {
      targets.push({ ...p, written: false, files: [] });
    }
  }

  const wroteSomething = targets.some((t) => t.written);
  const status: InstallSkillResult["status"] = wroteSomething ? "installed" : allCurrent ? "up-to-date" : "stale";

  return { status, targets };
}

export const skillCommand = defineCommand({
  meta: {
    name: "skill",
    description: "Install the R-Machine LLM-agent Skill into the target project.",
  },
  args: {
    out: {
      type: "string",
      description: `A single skills directory to install into (defaults to ${DEFAULT_TARGETS.join(" + ")}).`,
      required: false,
    },
    force: {
      type: "boolean",
      description: "Refresh the Skill even if it already exists at the destination.",
      default: false,
    },
  },
  async run({ args }) {
    intro(pc.redBright("R-Machine") + pc.dim(" : ") + pc.whiteBright("skill"));

    const prettyDest = (dest: string): string => relative(process.cwd(), dest) || dest;

    // Only ever called on an "installed" result, where every resolved target was
    // written (a fresh install writes all-absent; a confirmed update forces all).
    const report = (result: InstallSkillResult) => {
      const written = result.targets;

      log.success(
        pc.green(`Installed the R-Machine Skill to ${written.map((t) => pc.bold(prettyDest(t.dest))).join(", ")}`)
      );
      log.message(written[0].files.map((f) => pc.dim("  • ") + f).join("\n"));

      outro(
        `The agent will now pick up the Skill.\n` +
          pc.dim("  Commit it to share with your team.\n") +
          pc.dim(`  Add another location later with ${pc.bold("--out")}, e.g. rforge skill --out ./.agents/skills`)
      );
    };

    try {
      const first = await installSkill({ out: args.out, force: args.force });

      if (first.status === "installed") {
        report(first);
        return;
      }

      if (first.status === "up-to-date") {
        const dests = first.targets.map((t) => prettyDest(t.dest)).join(", ");
        outro(pc.green(`The R-Machine Skill is already up to date at ${pc.bold(dests)}.`));
        return;
      }

      // status === "stale": an update is available but was not written.
      const staleList = first.targets
        .filter((t) => t.state === "stale")
        .map((t) => prettyDest(t.dest))
        .join(", ");

      if (!process.stdout.isTTY) {
        // Non-interactive (CI, piped) sessions cannot be prompted.
        cancel(
          pc.red(`A newer R-Machine Skill is available for "${staleList}". Re-run with `) +
            pc.bold("--force") +
            pc.red(" to update.")
        );
        process.exitCode = 1;
        return;
      }

      const proceed = await confirm({ message: `Update the R-Machine Skill at "${staleList}"?`, initialValue: true });
      if (isCancel(proceed) || !proceed) {
        cancel("Update cancelled — nothing was written.");
        return;
      }

      report(await installSkill({ out: args.out, force: true }));
    } catch (err) {
      cancel(pc.red(`Installation failed: ${(err as Error).message}`));
      process.exitCode = 1;
    }
  },
});
