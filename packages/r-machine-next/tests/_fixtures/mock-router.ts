import { vi } from "vitest";

export function createMockRouter() {
  return { push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() };
}
