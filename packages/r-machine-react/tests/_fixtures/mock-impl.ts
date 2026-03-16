import type { AnyLocale } from "r-machine";
import { vi } from "vitest";
import type { ReactImpl } from "../../src/core/react-toolset.js";

export function createMockImpl(overrides: Partial<ReactImpl<AnyLocale>> = {}): ReactImpl<AnyLocale> {
  return {
    readLocale: overrides.readLocale ?? (() => "en"),
    writeLocale: overrides.writeLocale ?? vi.fn(),
  };
}
