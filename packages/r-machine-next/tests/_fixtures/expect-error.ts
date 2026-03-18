import { expect } from "vitest";

type ErrorConstructor<E extends Error> = new (...args: any[]) => E;

/**
 * Calls `fn`, asserts it throws an instance of `ErrorClass`, and returns the typed error
 * so callers can make further assertions on its properties (code, innerError, etc.).
 */
export function expectError<E extends Error>(fn: () => unknown, ErrorClass: ErrorConstructor<E>): E {
  try {
    fn();
    expect.unreachable("should have thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorClass);
    return error as E;
  }
}

/**
 * Awaits `fn`, asserts it rejects with an instance of `ErrorClass`, and returns the typed error
 * so callers can make further assertions on its properties (code, innerError, etc.).
 */
export async function expectAsyncError<E extends Error>(fn: () => Promise<unknown>, ErrorClass: ErrorConstructor<E>): Promise<E> {
  try {
    await fn();
    expect.unreachable("should have thrown");
  } catch (error) {
    expect(error).toBeInstanceOf(ErrorClass);
    return error as E;
  }
}
