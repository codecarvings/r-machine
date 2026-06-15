import { afterEach, describe, expect, it, vi } from "vitest";
import { isDevEnv } from "../../src/core/dev-env.js";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("isDevEnv", () => {
  it("is true by default under a non-production NODE_ENV (vitest runs as 'test')", () => {
    expect(isDevEnv()).toBe(true);
  });

  it("excludeTest=true returns false when NODE_ENV is 'test'", () => {
    expect(isDevEnv(true)).toBe(false);
  });

  it("returns false under NODE_ENV=production for both forms", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(isDevEnv()).toBe(false);
    expect(isDevEnv(true)).toBe(false);
  });

  it("returns false when `process` is undefined (browser without bundler replacement)", () => {
    vi.stubGlobal("process", undefined);
    expect(isDevEnv()).toBe(false);
    expect(isDevEnv(true)).toBe(false);
  });
});
