/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

import { RMachineError } from "./r-machine-error.js";

export class RMachineConfigError extends RMachineError {
  constructor(code: string, message: string, innerError?: Error) {
    super(code, message, innerError);
    this.name = "RMachineConfigError";
  }
}
