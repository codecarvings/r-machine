import { expect } from "vitest";
import { RMachineResolveError } from "../../src/errors/index.js";

/**
 * Run `fn`, assert it threw an {@link RMachineResolveError}, and return it so the
 * caller can make further assertions on `.code` / `.message`. Fails the test if
 * `fn` does not throw, or throws something other than an RMachineResolveError.
 *
 * Shared so the resolve-error assertion shape is identical everywhere instead of
 * being re-implemented per test file.
 */
export function captureResolveError(fn: () => unknown): RMachineResolveError {
  try {
    fn();
    expect.unreachable("expected an RMachineResolveError to be thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(RMachineResolveError);
    return error as RMachineResolveError;
  }
  // `expect.unreachable` throws, so this is unreachable — satisfies the TS return.
  throw new Error("unreachable");
}
