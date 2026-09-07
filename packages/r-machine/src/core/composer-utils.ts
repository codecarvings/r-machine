/**
 * Copyright (c) 2026 Sergio Turolla
 * SPDX-License-Identifier: Apache-2.0
 */

export function lazyGetters<T extends object>(
  factories: {
    readonly [K in keyof T]: () => T[K];
  }
): T {
  const target = {} as { [K in keyof T]: T[K] };
  for (const key of Object.keys(factories) as (keyof T)[]) {
    let value: T[keyof T];
    let initialized = false;
    Object.defineProperty(target, key, {
      enumerable: true,
      get() {
        if (!initialized) {
          value = factories[key]();
          initialized = true;
        }
        return value;
      },
    });
  }
  return target;
}
