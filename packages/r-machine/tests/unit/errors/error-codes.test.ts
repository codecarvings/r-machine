import { describe, expect, it } from "vitest";
import {
  ERR_DEFAULT_LOCALE_NOT_IN_LIST,
  ERR_DUPLICATE_LOCALES,
  ERR_INVALID_LOCALE_ID,
  ERR_NO_LOCALES,
  ERR_RESOLVE_FAILED,
  ERR_UNKNOWN_LOCALE,
} from "../../../src/errors/error-codes.js";

describe("error codes", () => {
  it.each([
    ["ERR_NO_LOCALES", ERR_NO_LOCALES],
    ["ERR_DUPLICATE_LOCALES", ERR_DUPLICATE_LOCALES],
    ["ERR_INVALID_LOCALE_ID", ERR_INVALID_LOCALE_ID],
    ["ERR_DEFAULT_LOCALE_NOT_IN_LIST", ERR_DEFAULT_LOCALE_NOT_IN_LIST],
    ["ERR_UNKNOWN_LOCALE", ERR_UNKNOWN_LOCALE],
    ["ERR_RESOLVE_FAILED", ERR_RESOLVE_FAILED],
  ])("%s should equal its variable name", (expected, actual) => {
    expect(actual).toBe(expected);
  });
});
