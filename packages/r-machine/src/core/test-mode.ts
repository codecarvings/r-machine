/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Per-RMachine "test mode" controller.
 *
 * Test mode is entered by `@r-machine/testing`'s `mockPlug` (`.with`/`.default`)
 * (reaching the owning machine via the Plug's `getPlugMachine` back-reference)
 * and read by the adapter guards (`@r-machine/next`, `@r-machine/react`) off the
 * `rMachine` they close over. While enabled it lets those guards relax
 * production-only checks and assume test defaults.
 *
 * It is **per instance** (not a process-global flag): each `RMachine` owns one
 * controller, so two machines are isolated and there is no mutable module
 * singleton. It is also self-securing — production never imports the testing
 * package, so `enter()` is never called and `isEnabled` stays `false`.
 *
 * Refcounted so several concurrently-active mocks (e.g. catalog + cart in one
 * test) keep test mode on until the LAST `exit()`. `epoch` bumps only on each
 * 0→1 transition — the "new test boundary" signal a consumer keys a
 * request-scoped cache on (e.g. the server locale context), so a value bound
 * during a test survives within it but is dropped when the next test re-enters.
 */
export class TestMode {
  #refCount = 0;
  #epoch = 0;

  enter(): void {
    if (this.#refCount === 0) {
      this.#epoch++;
    }
    this.#refCount++;
  }

  exit(): void {
    // Defensive: an unbalanced exit (e.g. a double reset) must not drive the
    // count negative and silently mask a later legitimate enter.
    if (this.#refCount > 0) {
      this.#refCount--;
    }
  }

  get isEnabled(): boolean {
    return this.#refCount > 0;
  }

  get epoch(): number {
    return this.#epoch;
  }
}
