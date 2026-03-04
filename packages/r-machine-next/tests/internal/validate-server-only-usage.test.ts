import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

async function importModules() {
  const { validateServerOnlyUsage } = await import("../../src/internal/validate-server-only-usage.js");
  const { RMachineUsageError } = await import("r-machine/errors");
  return { validateServerOnlyUsage, RMachineUsageError };
}

describe("validateServerOnlyUsage", () => {
  describe("in a client environment (React has useState)", () => {
    it("throws RMachineUsageError", async () => {
      const { validateServerOnlyUsage, RMachineUsageError } = await importModules();

      expect(() => validateServerOnlyUsage("Foo")).toThrow(RMachineUsageError);
    });

    it("throws with ERR_SERVER_ONLY code", async () => {
      const { validateServerOnlyUsage, RMachineUsageError } = await importModules();

      try {
        validateServerOnlyUsage("Foo");
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RMachineUsageError);
        expect((error as InstanceType<typeof RMachineUsageError>).code).toBe("ERR_SERVER_ONLY");
      }
    });

    it("includes the component name in the error message", async () => {
      const { validateServerOnlyUsage } = await importModules();

      expect(() => validateServerOnlyUsage("MyComponent")).toThrow(/MyComponent/);
    });
  });

  describe("in a server environment (React lacks useState)", () => {
    it("does not throw", async () => {
      vi.doMock("react", () => ({ default: {} }));

      const { validateServerOnlyUsage } = await import("../../src/internal/validate-server-only-usage.js");

      expect(() => validateServerOnlyUsage("Foo")).not.toThrow();
    });
  });
});
