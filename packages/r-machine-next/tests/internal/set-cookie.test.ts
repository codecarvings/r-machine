import type { CookieDeclaration } from "r-machine/strategy/web";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("js-cookie", () => ({
  default: { set: vi.fn() },
}));

// Must import after vi.mock so the mock is in place
import Cookies from "js-cookie";
import { setCookie } from "../../src/internal/set-cookie.js";

type Config = Omit<CookieDeclaration, "name">;

afterEach(() => {
  vi.mocked(Cookies.set).mockClear();
});

describe("setCookie", () => {
  it("converts maxAge (seconds) to an expires Date", () => {
    const now = new Date("2026-01-15T12:00:00Z");
    vi.setSystemTime(now);

    const config: Config = { maxAge: 3600 };
    setCookie("locale", "en", config);

    expect(Cookies.set).toHaveBeenCalledWith("locale", "en", {
      domain: undefined,
      path: "/",
      expires: new Date("2026-01-15T13:00:00Z"),
      secure: undefined,
      sameSite: undefined,
    });

    vi.useRealTimers();
  });

  it("defaults path to '/' when not specified", () => {
    setCookie("locale", "en", {});

    expect(Cookies.set).toHaveBeenCalledWith("locale", "en", expect.objectContaining({ path: "/" }));
  });

  it("uses the provided path", () => {
    setCookie("locale", "en", { path: "/app" });

    expect(Cookies.set).toHaveBeenCalledWith("locale", "en", expect.objectContaining({ path: "/app" }));
  });

  it("passes expires as undefined when maxAge is not set", () => {
    setCookie("locale", "en", {});

    expect(Cookies.set).toHaveBeenCalledWith("locale", "en", expect.objectContaining({ expires: undefined }));
  });

  it("forwards domain, secure, and sameSite", () => {
    const config: Config = {
      domain: ".example.com",
      secure: true,
      sameSite: "strict",
    };

    setCookie("lang", "fr", config);

    expect(Cookies.set).toHaveBeenCalledWith(
      "lang",
      "fr",
      expect.objectContaining({
        domain: ".example.com",
        secure: true,
        sameSite: "strict",
      })
    );
  });
});
