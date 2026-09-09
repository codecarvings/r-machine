/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineCommand } from "citty";
import { skillCommand } from "./commands/skill.js";
import { CLI_VERSION } from "./version.js";

export const CLI_NAME = "rforge";

export const main = defineCommand({
  meta: {
    name: CLI_NAME,
    version: CLI_VERSION,
    description: "Command-line interface for R-Machine.",
  },
  subCommands: {
    skill: skillCommand,
  },
});

export { skillCommand };
