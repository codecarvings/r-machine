import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultCookieDeclaration, getCookie, setCookie } from "../../../src/strategy/web/cookie.js";

// ---------------------------------------------------------------------------
// Stub document.cookie — vitest runs in Node, no real DOM
// ---------------------------------------------------------------------------

let cookieJar: string;

beforeEach(() => {
  cookieJar = "";
  vi.stubGlobal("document", {
    get cookie() {
      return cookieJar;
    },
    set cookie(value: string) {
      // Real browsers accumulate; for setCookie tests we just capture the last write
      cookieJar = value;
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// defaultCookieDeclaration
// ---------------------------------------------------------------------------

describe("defaultCookieDeclaration", () => {
  it("should have the expected default values", () => {
    expect(defaultCookieDeclaration).toEqual({
      name: "rm-locale",
      maxAge: 2_592_000,
      path: "/",
    });
  });
});

// ---------------------------------------------------------------------------
// getCookie
// ---------------------------------------------------------------------------

describe("getCookie", () => {
  it("returns the value of a matching cookie", () => {
    cookieJar = "locale=en; theme=dark";

    expect(getCookie("locale")).toBe("en");
    expect(getCookie("theme")).toBe("dark");
  });

  it("returns undefined when the cookie does not exist", () => {
    cookieJar = "locale=en";

    expect(getCookie("missing")).toBeUndefined();
  });

  it("returns undefined from an empty cookie jar", () => {
    cookieJar = "";

    expect(getCookie("anything")).toBeUndefined();
  });

  it("decodes percent-encoded values", () => {
    cookieJar = "msg=hello%20world%3B";

    expect(getCookie("msg")).toBe("hello world;");
  });

  it("does not match a cookie whose name is a substring of another", () => {
    cookieJar = "rm-locale-v2=it; rm-locale=en";

    expect(getCookie("rm-locale")).toBe("en");
  });

  it("matches a cookie that has regex-special characters in its name", () => {
    cookieJar = "a.b=1; c[0]=2";

    expect(getCookie("a.b")).toBe("1");
    expect(getCookie("c[0]")).toBe("2");
  });

  it("handles a cookie with an empty value", () => {
    cookieJar = "empty=";

    expect(getCookie("empty")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// setCookie
// ---------------------------------------------------------------------------

describe("setCookie", () => {
  it("writes name=value with default path '/' when config is empty", () => {
    setCookie("locale", "en", {});

    expect(cookieJar).toBe("locale=en; path=/");
  });

  it("uses the provided path instead of the default", () => {
    setCookie("locale", "en", { path: "/app" });

    expect(cookieJar).toContain("path=/app");
    expect(cookieJar).not.toContain("path=/;");
  });

  it("appends domain when specified", () => {
    setCookie("locale", "en", { domain: ".example.com" });

    expect(cookieJar).toContain("; domain=.example.com");
  });

  it("appends max-age when specified", () => {
    setCookie("locale", "en", { maxAge: 3600 });

    expect(cookieJar).toContain("; max-age=3600");
  });

  it("appends max-age=0 for immediate expiry", () => {
    setCookie("locale", "en", { maxAge: 0 });

    expect(cookieJar).toContain("; max-age=0");
  });

  it("appends secure flag when true", () => {
    setCookie("locale", "en", { secure: true });

    expect(cookieJar).toContain("; secure");
  });

  it("omits secure flag when false", () => {
    setCookie("locale", "en", { secure: false });

    expect(cookieJar).not.toContain("secure");
  });

  it("appends samesite when specified", () => {
    setCookie("locale", "en", { sameSite: "strict" });

    expect(cookieJar).toContain("; samesite=strict");
  });

  it("omits optional attributes when not provided", () => {
    setCookie("locale", "en", {});

    expect(cookieJar).toBe("locale=en; path=/");
  });

  it("builds a full cookie string with all options", () => {
    setCookie("locale", "it", {
      path: "/app",
      domain: ".example.com",
      maxAge: 86400,
      secure: true,
      sameSite: "lax",
    });

    expect(cookieJar).toBe("locale=it; path=/app; domain=.example.com; max-age=86400; secure; samesite=lax");
  });

  it("percent-encodes name and value", () => {
    setCookie("a b", "hello world", {});

    expect(cookieJar.startsWith("a%20b=hello%20world;")).toBe(true);
  });

  it("encodes cookie-special characters in value so they do not break parsing", () => {
    setCookie("data", "a=1; drop=evil", {});

    expect(cookieJar.startsWith("data=a%3D1%3B%20drop%3Devil;")).toBe(true);
  });
});
