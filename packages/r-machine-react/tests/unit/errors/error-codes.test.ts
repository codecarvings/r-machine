import { describe, expect, it } from "vitest";
import { ERR_CONTEXT_NOT_FOUND, ERR_MISSING_WRITE_LOCALE } from "../../../src/errors/error-codes.js";

describe("error codes", () => {
  it.each([
    ["ERR_CONTEXT_NOT_FOUND", ERR_CONTEXT_NOT_FOUND],
    ["ERR_MISSING_WRITE_LOCALE", ERR_MISSING_WRITE_LOCALE],
  ])("%s should equal its variable name", (expected, actual) => {
    expect(actual).toBe(expected);
  });
});
