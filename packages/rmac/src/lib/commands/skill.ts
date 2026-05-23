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

import { defineCommand } from "citty";

export const skillCommand = defineCommand({
  meta: {
    name: "skill",
    description: "Generate or install the R-Machine LLM-agent Skill in the target project.",
  },
  args: {
    out: {
      type: "string",
      description: "Output directory for the generated Skill (defaults to ./.claude/skills).",
      required: false,
    },
    force: {
      type: "boolean",
      description: "Overwrite the Skill if it already exists at the destination.",
      default: false,
    },
  },
  async run({ args }) {
    const out = args.out ?? "./.claude/skills";
    console.log(`[rmac skill] (draft) would write Skill to: ${out}`);
    console.log(`[rmac skill] force=${args.force}`);
    console.log("[rmac skill] Not implemented yet — initial draft.");
  },
});
