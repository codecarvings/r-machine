/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export class RMachineError extends Error {
  constructor(
    readonly code: string,
    message: string,
    public readonly innerError?: Error
  ) {
    super(`R-Machine Error [${code}]: ${message}`);
    this.name = "RMachineError";
  }
}
