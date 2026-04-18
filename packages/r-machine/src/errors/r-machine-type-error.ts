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

// Branded error helper surfaced in TypeScript diagnostics. When a constraint
// or parameter type resolves to RMachineTypeError<"…">, the message appears
// inline in the error, making the failure self-explanatory instead of an
// opaque structural mismatch like "not assignable to NamespaceRef<…>".
//
// Usage pattern: in a conditional type, return `T` for the success case and
// `RMachineTypeError<"message">` for the failure case. Applied either as an
// intersection on the param type or directly as the mapped value.
export type RMachineTypeError<Msg extends string> = {
  readonly __rMachineTypeError: Msg;
};
