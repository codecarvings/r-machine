#!/usr/bin/env node
/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import { runMain } from "citty";
import { printBanner } from "./cli/banner.js";
import { main } from "./cli/index.js";

if (process.argv.slice(2).length === 0) {
  printBanner();
}

runMain(main);
