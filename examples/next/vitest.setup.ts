import "@testing-library/jest-dom/vitest";
import { resetMockPlugs } from "@r-machine/testing";
import { afterEach } from "vitest";

// Safety net: drain any mock plug a test forgot to reset, so a leaked test-mode
// refcount can't bleed into the next test (and dispose the machine for isolation).
afterEach(() => {
  resetMockPlugs();
});
