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
/** biome-ignore-all lint/style/useTemplate: ASCII */

import pc from "picocolors";

export function printBanner(): void {
  const lines = [
    "",
    pc.red(" ██████╗ ███╗   ███╗"),
    pc.red(" ██╔══██╗████╗ ████║") + `      ${pc.whiteBright("R-MACHINE")}`,
    pc.red(" ██████╔╝██╔████╔██║") + `      ${pc.dim("──────────────────────────────────")}`,
    pc.red(" ██╔══██╗██║╚██╔╝██║") + `      ${pc.dim("Uniformity Under Change")}`,
    pc.red(" ██║  ██║██║ ╚═╝ ██║") + `      ${pc.dim("https://r-machine.codecarvings.com")}`,
    pc.red(" ╚═╝  ╚═╝╚═╝     ╚═╝"),
    "",
  ];
  console.log(lines.join("\n"));
}
