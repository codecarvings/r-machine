/**
 * Copyright (c) 2026 Sergio Turolla and R-Machine contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Branded error helper surfaced in TypeScript diagnostics. When a constraint
// or parameter type resolves to RMachineTypeError<"…">, the message appears
// inline in the error, making the failure self-explanatory instead of an
// opaque structural mismatch like "not assignable to Handle<…>".
//
// Usage pattern: in a conditional type, return `T` for the success case and
// `RMachineTypeError<"message">` for the failure case. Applied either as an
// intersection on the param type or directly as the mapped value.
export type RMachineTypeError<Msg extends string> = {
  readonly __rMachineTypeError: Msg;
};
