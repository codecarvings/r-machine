import type { AnyResAtlas } from "r-machine/core";
import type { CustomLocaleStore } from "r-machine/strategy";
import { vi } from "vitest";
import type { ReactPlugKitMap } from "../../src/core/react-plug.js";
import type { ReactStandardStrategyConfig } from "../../src/core/react-standard-strategy-core.js";

type AnyKitMap = ReactPlugKitMap<AnyResAtlas>;

export function configWith(
  overrides: Partial<ReactStandardStrategyConfig<AnyResAtlas, AnyKitMap>> = {}
): ReactStandardStrategyConfig<AnyResAtlas, AnyKitMap> {
  return {
    kit: {} as AnyKitMap,
    reactCompiler: "off",
    localeDetector: undefined,
    localeStore: undefined,
    ...overrides,
  };
}

export function syncStore(initial?: string): CustomLocaleStore & { value: string | undefined } {
  const store = {
    value: initial,
    get: vi.fn(() => store.value),
    set: vi.fn((locale: string) => {
      store.value = locale;
    }),
  };
  return store;
}

export function asyncStore(initial?: string, delay = 0): CustomLocaleStore & { value: string | undefined } {
  const store = {
    value: initial,
    get: vi.fn(async () => {
      if (delay) {
        await new Promise<void>((r) => setTimeout(r, delay));
      }
      return store.value;
    }),
    set: vi.fn(async (locale: string) => {
      if (delay) {
        await new Promise<void>((r) => setTimeout(r, delay));
      }
      store.value = locale;
    }),
  };
  return store;
}
