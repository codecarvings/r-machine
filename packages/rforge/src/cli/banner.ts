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
    pc.redBright(" ⠀⠀⠀⠀⣀⣴⣾⣷⣦⣀⠀⠀⠀⠀ "),
    pc.redBright(" ⠀⣀⣴⣿⠟⠉⠀⠀⠉⠻⣷⣦⣀⠀ "),
    pc.redBright(" ⣿⠟⠉⠀⣀⣴⣾⣷⣦⣀⠀⠉⠻⣿ ") + `      ${pc.redBright("R-MACHINE")} ${pc.dim(":")} ${pc.whiteBright("FORGE")}`,
    pc.redBright(" ⣿⣀⣴⣾⠟⠉⠀⣀⣿⡿⠗⠀⠀⣿ ") + `      ${pc.dim("──────────────────────────────────────")}`,
    pc.redBright(" ⣿⠟⠉⠀⣀⣴⣾⠟⠉⠀⣀⣴⣿⠟ ") + `      ${pc.dim("Uniformity Under Change for Typescript")}`,
    pc.redBright(" ⠀⣀⣴⣿⠟⠉⠀⠀⠀⠻⣿⣯⣀⠀ ") + `      ${pc.dim("https://rmachine.dev")}`,
    pc.redBright(" ⣿⠟⠉⠀⣀⣴⣾⣷⣦⣀⠀⠉⠻⣿ "),
    pc.redBright(" ⣿⣀⣴⣿⠟⠉⠀⠀⠉⠻⣿⣦⣀⣿ "),
    pc.redBright(" ⣿⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿ "),
    "",
  ];
  console.log(lines.join("\n"));
}
