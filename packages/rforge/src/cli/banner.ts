/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */
/** biome-ignore-all lint/style/useTemplate: ASCII */

import pc from "picocolors";

export function printBanner(): void {
  const lines = [
    "",
    pc.redBright(" ⠀⠀⠀⠀⣀⣴⣾⣷⣦⣀⠀⠀⠀⠀ "),
    pc.redBright(" ⠀⣀⣴⣿⠟⠉⠀⠀⠉⠻⣷⣦⣀⠀ "),
    pc.redBright(" ⣿⠟⠉⠀⣀⣴⣾⣷⣦⣀⠀⠉⠻⣿ ") + `      ${pc.redBright("R-MACHINE")} ${pc.dim(":")} ${pc.whiteBright("FORGE")}`,
    pc.redBright(" ⣿⣀⣴⣾⠟⠉⠀⣀⣿⡿⠗⠀⠀⣿ ") + `      ${pc.dim("─────────────────────────────────────────────────")}`,
    pc.redBright(" ⣿⠟⠉⠀⣀⣴⣾⠟⠉⠀⣀⣴⣿⠟ ") + `      ${pc.dim("A TypeScript resource layer for React and Next.js")}`,
    pc.redBright(" ⠀⣀⣴⣿⠟⠉⠀⠀⠀⠻⣿⣯⣀⠀ ") + `      ${pc.dim("https://rmachine.dev")}`,
    pc.redBright(" ⣿⠟⠉⠀⣀⣴⣾⣷⣦⣀⠀⠉⠻⣿ "),
    pc.redBright(" ⣿⣀⣴⣿⠟⠉⠀⠀⠉⠻⣿⣦⣀⣿ "),
    pc.redBright(" ⣿⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿ "),
    "",
  ];
  console.log(lines.join("\n"));
}
