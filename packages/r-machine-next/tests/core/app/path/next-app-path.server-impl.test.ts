import { afterEach, describe, expect, it, vi } from "vitest";
import { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { validateServerOnlyUsage } from "#r-machine/next/internal";
import { createNextAppPathServerImpl } from "../../../../src/core/app/path/next-app-path.server-impl.js";
import type { AnyNextAppPathStrategyConfig } from "../../../../src/core/app/path/next-app-path-strategy-core.js";
import {
  aboutAtlas,
  aboutWithTeamAtlas,
  createMockAtlas,
  docsWithCatchAllAtlas,
  docsWithOptionalCatchAllAtlas,
  productsAtlas,
} from "../../../_fixtures/_helpers.js";
import { TEST_DEFAULT_LOCALE as defaultLocale, TEST_LOCALES as locales } from "../../../_fixtures/constants.js";
import { createMockMachineForProxy } from "../../../_fixtures/mock-machine.js";
import { createMockCookiesFn, createMockHeadersFn, createMockRequest } from "../../../_fixtures/mock-server-helpers.js";
import type { AnyProxyFn, AnySupplierFn, MockRewriteArgs } from "../../../_fixtures/test-types.js";

type AnyRouteHandlers = { entrance: { GET: () => Promise<void> } };

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

const mockRewrite = vi.fn((..._args: unknown[]) => ({ _type: "rewrite" }));
const mockNext = vi.fn((..._args: any[]) => ({ _type: "next" }));
const mockRedirectResponse = vi.fn((..._args: any[]) => ({
  _type: "redirect" as const,
  cookies: { set: vi.fn() },
}));
vi.mock("next/server", () => ({
  NextResponse: {
    rewrite: (...args: any[]) => mockRewrite(...args),
    next: (...args: any[]) => mockNext(...args),
    redirect: (...args: any[]) => mockRedirectResponse(...args),
  },
}));

vi.mock("#r-machine/next/internal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#r-machine/next/internal")>();
  return {
    ...actual,
    validateServerOnlyUsage: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockStrategyConfig(overrides: Partial<AnyNextAppPathStrategyConfig> = {}) {
  return {
    localeKey: "locale",
    autoLocaleBinding: "off",
    basePath: "",
    cookie: { name: "NEXT_LOCALE", path: "/", maxAge: 31536000 },
    localeLabel: "lowercase",
    autoDetectLocale: "on",
    implicitDefaultLocale: "off",
    ...overrides,
  } as AnyNextAppPathStrategyConfig;
}

interface CreateImplOptions {
  atlas?: ReturnType<typeof createMockAtlas>;
  autoLocaleBinding?: "on" | "off";
  localeKey?: string;
  localeLabel?: "strict" | "lowercase";
  cookie?: "on" | "off" | { name: string; path?: string; maxAge?: number };
  autoDetectLocale?: "on" | "off" | { pathMatcher: RegExp | null };
  implicitDefaultLocale?: "on" | "off" | { pathMatcher: RegExp | null };
  basePath?: string;
  matchLocaleReturn?: string;
  pathCanonicalizer?: HrefCanonicalizer;
}

async function createImpl(options: CreateImplOptions = {}) {
  const atlas = options.atlas ?? createMockAtlas();

  const rMachine = createMockMachineForProxy({
    matchLocaleReturn: options.matchLocaleReturn,
  });

  const strategyConfig = createMockStrategyConfig({
    autoLocaleBinding: options.autoLocaleBinding ?? "off",
    ...(options.localeKey !== undefined ? { localeKey: options.localeKey } : {}),
    ...(options.localeLabel !== undefined ? { localeLabel: options.localeLabel } : {}),
    ...(options.cookie !== undefined ? { cookie: options.cookie } : {}),
    ...(options.autoDetectLocale !== undefined ? { autoDetectLocale: options.autoDetectLocale } : {}),
    ...(options.implicitDefaultLocale !== undefined ? { implicitDefaultLocale: options.implicitDefaultLocale } : {}),
    ...(options.basePath !== undefined ? { basePath: options.basePath } : {}),
  });
  const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
  const pathCanonicalizer = options.pathCanonicalizer ?? new HrefCanonicalizer(atlas, [...locales], defaultLocale);

  const impl = await createNextAppPathServerImpl(rMachine, strategyConfig, pathTranslator, pathCanonicalizer);

  return { impl, rMachine, strategyConfig, pathTranslator, pathCanonicalizer };
}

function createMockCookiesGetFn(options: { cookie?: string; cookieName?: string } = {}): any {
  const cookieName = options.cookieName ?? "NEXT_LOCALE";
  return vi.fn(async () => ({
    get: (name: string) => {
      if (name === cookieName && options.cookie !== undefined) {
        return { value: options.cookie };
      }
      return undefined;
    },
  }));
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createNextAppPathServerImpl", () => {
  it("exposes the configured localeKey", async () => {
    const { impl } = await createImpl({ localeKey: "lang" });

    expect(impl.localeKey).toBe("lang");
  });

  it("enables autoLocaleBinding when config is 'on'", async () => {
    const { impl } = await createImpl({ autoLocaleBinding: "on" });

    expect(impl.autoLocaleBinding).toBe(true);
  });

  it("disables autoLocaleBinding when config is 'off'", async () => {
    const { impl } = await createImpl({ autoLocaleBinding: "off" });

    expect(impl.autoLocaleBinding).toBe(false);
  });

  // -----------------------------------------------------------------------
  // writeLocale
  // -----------------------------------------------------------------------

  describe("writeLocale", () => {
    it("does nothing when newLocale equals locale", async () => {
      const { impl } = await createImpl();
      const { cookiesFn } = createMockCookiesFn();
      const headersFn = createMockHeadersFn();

      await impl.writeLocale("en", "en", cookiesFn, headersFn);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(cookiesFn).not.toHaveBeenCalled();
      expect(headersFn).not.toHaveBeenCalled();
    });

    it("redirects to the translated path derived from x-rm-sccpath header", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });
      const { cookiesFn } = createMockCookiesFn();
      const headersFn = createMockHeadersFn({ "x-rm-sccpath": "/about" });

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/chi-siamo");
    });

    it("falls back to root translation when x-rm-sccpath header is absent", async () => {
      const { impl } = await createImpl();
      const { cookiesFn } = createMockCookiesFn();
      const headersFn = createMockHeadersFn();

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/");
    });

    it("translates nested static paths during locale switch", async () => {
      const { impl } = await createImpl({ atlas: aboutWithTeamAtlas });
      const { cookiesFn } = createMockCookiesFn();
      const headersFn = createMockHeadersFn({ "x-rm-sccpath": "/about/team" });

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/chi-siamo/staff");
    });

    it("translates correctly when switching from a non-default locale", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });
      const { cookiesFn } = createMockCookiesFn();
      const headersFn = createMockHeadersFn({ "x-rm-sccpath": "/about" });

      await impl.writeLocale("it", "en", cookiesFn, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/about");
    });

    it("sets locale cookie before redirecting", async () => {
      const { impl } = await createImpl();
      const { cookiesFn, mockSet } = createMockCookiesFn();
      const headersFn = createMockHeadersFn();

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(cookiesFn).toHaveBeenCalledOnce();
      expect(mockSet).toHaveBeenCalledWith("NEXT_LOCALE", "it", expect.objectContaining({ path: "/" }));
      expect(mockRedirect).toHaveBeenCalledOnce();

      const cookieSetOrder = mockSet.mock.invocationCallOrder[0];
      const redirectOrder = mockRedirect.mock.invocationCallOrder[0];
      expect(cookieSetOrder).toBeLessThan(redirectOrder);
    });

    it("uses custom cookie name and config for locale storage", async () => {
      const { impl } = await createImpl({ cookie: { name: "MY_LOCALE", path: "/app" } });
      const { cookiesFn, mockSet } = createMockCookiesFn();
      const headersFn = createMockHeadersFn();

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(mockSet).toHaveBeenCalledWith("MY_LOCALE", "it", expect.objectContaining({ path: "/app" }));
    });

    it("uses defaultCookieDeclaration when cookie is 'on'", async () => {
      const { impl } = await createImpl({ cookie: "on" });
      const { cookiesFn, mockSet } = createMockCookiesFn();
      const headersFn = createMockHeadersFn();

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(mockSet).toHaveBeenCalledWith("rm-locale", "it", expect.objectContaining({ path: "/" }));
    });

    it("skips cookie operations when cookie is 'off'", async () => {
      const { impl } = await createImpl({ cookie: "off" });
      const { cookiesFn } = createMockCookiesFn();
      const headersFn = createMockHeadersFn();

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(cookiesFn).not.toHaveBeenCalled();
      expect(mockRedirect).toHaveBeenCalledOnce();
    });

    it("preserves undeclared paths as-is during locale switch", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });
      const { cookiesFn } = createMockCookiesFn();
      const headersFn = createMockHeadersFn({ "x-rm-sccpath": "/unknown-page" });

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/unknown-page");
    });

    it("warns and still redirects when cookie cannot be set outside a Server Action", async () => {
      const { impl } = await createImpl();
      const { cookiesFn } = createMockCookiesFn({ succeedOnSet: false });
      const headersFn = createMockHeadersFn();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Unable to set locale cookie"));
      expect(mockRedirect).toHaveBeenCalledOnce();
    });
  });

  // -----------------------------------------------------------------------
  // createLocaleStaticParamsGenerator
  // -----------------------------------------------------------------------

  describe("createLocaleStaticParamsGenerator", () => {
    it("generates static params for each locale using the configured localeKey", async () => {
      const { impl } = await createImpl();
      const generator = impl.createLocaleStaticParamsGenerator() as () => Promise<Record<string, string>[]>;
      const params = await generator();

      expect(params).toEqual([{ locale: "en" }, { locale: "it" }]);
    });

    it("respects a custom localeKey in generated static params", async () => {
      const { impl } = await createImpl({ localeKey: "lang" });
      const generator = impl.createLocaleStaticParamsGenerator() as () => Promise<Record<string, string>[]>;
      const params = await generator();

      expect(params).toEqual([{ lang: "en" }, { lang: "it" }]);
    });

    it("lowercases locale values when localeLabel is 'lowercase'", async () => {
      const rMachine = createMockMachineForProxy({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" });
      const config = createMockStrategyConfig({ localeLabel: "lowercase" });
      const pathTranslator = new HrefTranslator(createMockAtlas(), ["en-US", "it-IT"], "en-US");
      const pathCanonicalizer = new HrefCanonicalizer(createMockAtlas(), ["en-US", "it-IT"], "en-US");

      const impl = await createNextAppPathServerImpl(rMachine, config, pathTranslator, pathCanonicalizer);
      const generator = impl.createLocaleStaticParamsGenerator() as () => Promise<Record<string, string>[]>;
      const params = await generator();

      expect(params).toEqual([{ locale: "en-us" }, { locale: "it-it" }]);
    });

    it("preserves locale case when localeLabel is 'strict'", async () => {
      const rMachine = createMockMachineForProxy({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" });
      const config = createMockStrategyConfig({ localeLabel: "strict" });
      const pathTranslator = new HrefTranslator(createMockAtlas(), ["en-US", "it-IT"], "en-US");
      const pathCanonicalizer = new HrefCanonicalizer(createMockAtlas(), ["en-US", "it-IT"], "en-US");

      const impl = await createNextAppPathServerImpl(rMachine, config, pathTranslator, pathCanonicalizer);
      const generator = impl.createLocaleStaticParamsGenerator() as () => Promise<Record<string, string>[]>;
      const params = await generator();

      expect(params).toEqual([{ locale: "en-US" }, { locale: "it-IT" }]);
    });
  });

  // -----------------------------------------------------------------------
  // createProxy
  // -----------------------------------------------------------------------

  describe("createProxy", () => {
    // -------------------------------------------------------------------
    // Locale-in-URL detection
    // -------------------------------------------------------------------

    describe("locale-in-URL detection", () => {
      it("rewrites locale-prefixed URL to canonical form", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas, autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/it/chi-siamo"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });

      it("matches locale prefix case-insensitively", async () => {
        const { impl } = await createImpl({ autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/EN/"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/");
      });

      it("normalizes mixed-case locale via getCanonicalUnicodeLocaleId", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas, autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/IT/chi-siamo"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });
    });

    // -------------------------------------------------------------------
    // implicitDefaultLocale off + autoDetectLocale on (default config)
    // -------------------------------------------------------------------

    describe("implicitDefaultLocale off with autoDetectLocale on (default)", () => {
      it("redirects unprefixed URLs using cookie locale", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", { cookie: "it" }));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/it/about");
        expect(mockRewrite).not.toHaveBeenCalled();
      });

      it("redirects unprefixed URLs using Accept-Language when no cookie", async () => {
        const { impl, rMachine } = await createImpl({
          atlas: aboutAtlas,
          matchLocaleReturn: "it",
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", { acceptLanguage: "it-IT,it;q=0.9" }));

        expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).toHaveBeenCalledWith("it-IT,it;q=0.9");
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/it/about");
      });

      it("redirects to default locale when no cookie and no Accept-Language preference", async () => {
        const { impl } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about"));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/en/about");
      });

      it("ignores unknown cookie locale and falls back to Accept-Language", async () => {
        const { impl, rMachine } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/", { cookie: "fr" }));

        expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).toHaveBeenCalledOnce();
      });

      it("redirects to default locale prefixed URL when cookie contains default locale", async () => {
        const { impl, rMachine } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", { cookie: "en" }));

        expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).not.toHaveBeenCalled();
        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/en/about");
      });

      it("passes through Next.js internal paths", async () => {
        const { impl } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/_next/static/chunk.js"));

        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
        expect(mockRedirectResponse).not.toHaveBeenCalled();
      });

      it("passes through API routes", async () => {
        const { impl } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/api/data"));

        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
      });

      it("passes through paths with file extensions", async () => {
        const { impl } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/favicon.ico"));

        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
      });

      it("passes through Vercel internal paths", async () => {
        const { impl } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/_vercel/insights"));

        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
      });

      it("still rewrites locale-prefixed URLs", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/it/chi-siamo"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });
    });

    // -------------------------------------------------------------------
    // implicitDefaultLocale off + autoDetectLocale off
    // -------------------------------------------------------------------

    describe("implicitDefaultLocale off with autoDetectLocale off", () => {
      it("passes through unprefixed URLs", async () => {
        const { impl } = await createImpl({ autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        const result = proxy(createMockRequest("/about"));

        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
        expect(mockRedirectResponse).not.toHaveBeenCalled();
        expect(result).toEqual({ _type: "next" });
      });

      it("still rewrites locale-prefixed URLs", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas, autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en/about"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/about");
      });
    });

    // -------------------------------------------------------------------
    // implicitDefaultLocale off + autoDetectLocale custom pathMatcher
    // -------------------------------------------------------------------

    describe("autoDetectLocale with custom pathMatcher", () => {
      it("redirects URLs matching the custom pathMatcher", async () => {
        const { impl } = await createImpl({
          autoDetectLocale: { pathMatcher: /^\/$/ },
          matchLocaleReturn: "it",
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/"));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/it/");
      });

      it("passes through URLs not matching the custom pathMatcher", async () => {
        const { impl } = await createImpl({
          autoDetectLocale: { pathMatcher: /^\/$/ },
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about"));

        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRedirectResponse).not.toHaveBeenCalled();
      });

      it("redirects all URLs when custom pathMatcher is null", async () => {
        const { impl } = await createImpl({
          autoDetectLocale: { pathMatcher: null },
          matchLocaleReturn: "it",
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/any/path"));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
      });
    });

    // -------------------------------------------------------------------
    // implicitDefaultLocale on
    // -------------------------------------------------------------------

    describe("implicitDefaultLocale on", () => {
      it("redirects default locale in URL to implicit URL (strips prefix)", async () => {
        const { impl } = await createImpl({ implicitDefaultLocale: "on" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en/about"));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/about");
        expect(mockRewrite).not.toHaveBeenCalled();
      });

      it("sets cookie on redirect when cookie locale differs from default", async () => {
        const { impl } = await createImpl({ implicitDefaultLocale: "on" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en/about", { cookie: "it" }));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const response = mockRedirectResponse.mock.results[0].value;
        expect(response.cookies.set).toHaveBeenCalledWith("NEXT_LOCALE", "en", expect.objectContaining({ path: "/" }));
      });

      it("does not set cookie on redirect when cookie already matches", async () => {
        const { impl } = await createImpl({ implicitDefaultLocale: "on" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en/about", { cookie: "en" }));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const response = mockRedirectResponse.mock.results[0].value;
        expect(response.cookies.set).not.toHaveBeenCalled();
      });

      it("does not set cookie on redirect when cookie is disabled", async () => {
        const { impl } = await createImpl({ implicitDefaultLocale: "on", cookie: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en/about"));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const response = mockRedirectResponse.mock.results[0].value;
        expect(response.cookies.set).not.toHaveBeenCalled();
      });

      it("rewrites non-default locale in URL", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas, implicitDefaultLocale: "on" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/it/chi-siamo"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
        expect(mockRedirectResponse).not.toHaveBeenCalled();
      });

      it("rewrites implicit URL (no prefix) as default locale", async () => {
        const { impl } = await createImpl({
          atlas: aboutAtlas,
          implicitDefaultLocale: "on",
          autoDetectLocale: "off",
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/about");
      });

      it("passes through non-implicit paths (not matching defaultPathMatcher)", async () => {
        const { impl } = await createImpl({ implicitDefaultLocale: "on", autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/_next/static/chunk.js"));

        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
        expect(mockRedirectResponse).not.toHaveBeenCalled();
      });

      describe("auto-detect on implicit URLs", () => {
        it("auto-detects only on root path by default (implicit + autoDetect on)", async () => {
          const { impl } = await createImpl({
            implicitDefaultLocale: "on",
            autoDetectLocale: "on",
            matchLocaleReturn: "it",
          });
          const proxy = impl.createProxy() as AnyProxyFn;

          proxy(createMockRequest("/"));

          expect(mockRedirectResponse).toHaveBeenCalledOnce();
          const [url] = mockRedirectResponse.mock.calls[0] as [URL];
          expect(url.pathname).toBe("/it/");
        });

        it("does not auto-detect on non-root paths", async () => {
          const { impl } = await createImpl({
            implicitDefaultLocale: "on",
            autoDetectLocale: "on",
            matchLocaleReturn: "it",
          });
          const proxy = impl.createProxy() as AnyProxyFn;

          proxy(createMockRequest("/about"));

          expect(mockRewrite).toHaveBeenCalledOnce();
          const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
          expect(url.pathname).toBe("/en/about");
          expect(mockRedirectResponse).not.toHaveBeenCalled();
        });

        it("rewrites as default locale when default locale is detected on root", async () => {
          const { impl } = await createImpl({
            implicitDefaultLocale: "on",
            autoDetectLocale: "on",
            matchLocaleReturn: "en",
          });
          const proxy = impl.createProxy() as AnyProxyFn;

          proxy(createMockRequest("/"));

          expect(mockRewrite).toHaveBeenCalledOnce();
          const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
          expect(url.pathname).toBe("/en/");
          expect(mockRedirectResponse).not.toHaveBeenCalled();
        });

        it("uses cookie locale for auto-detection when available", async () => {
          const { impl } = await createImpl({
            implicitDefaultLocale: "on",
            autoDetectLocale: "on",
          });
          const proxy = impl.createProxy() as AnyProxyFn;

          proxy(createMockRequest("/", { cookie: "it" }));

          expect(mockRedirectResponse).toHaveBeenCalledOnce();
          const [url] = mockRedirectResponse.mock.calls[0] as [URL];
          expect(url.pathname).toBe("/it/");
        });

        it("falls back to Accept-Language when no cookie on root", async () => {
          const { impl, rMachine } = await createImpl({
            implicitDefaultLocale: "on",
            autoDetectLocale: "on",
            matchLocaleReturn: "it",
          });
          const proxy = impl.createProxy() as AnyProxyFn;

          proxy(createMockRequest("/", { acceptLanguage: "it" }));

          expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).toHaveBeenCalledWith("it");
          expect(mockRedirectResponse).toHaveBeenCalledOnce();
        });
      });

      describe("with custom implicitDefaultLocale pathMatcher", () => {
        it("applies custom pathMatcher for implicit URL matching", async () => {
          const { impl } = await createImpl({
            implicitDefaultLocale: { pathMatcher: /^\/app/ },
            autoDetectLocale: "off",
          });
          const proxy = impl.createProxy() as AnyProxyFn;

          proxy(createMockRequest("/app/dashboard"));

          expect(mockRewrite).toHaveBeenCalledOnce();
          const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
          expect(url.pathname).toBe("/en/app/dashboard");
        });

        it("passes through paths not matching the custom pathMatcher", async () => {
          const { impl } = await createImpl({
            implicitDefaultLocale: { pathMatcher: /^\/app/ },
            autoDetectLocale: "off",
          });
          const proxy = impl.createProxy() as AnyProxyFn;

          proxy(createMockRequest("/other"));

          expect(mockNext).toHaveBeenCalledOnce();
          expect(mockRewrite).not.toHaveBeenCalled();
        });

        it("treats all paths as implicit when pathMatcher is null", async () => {
          const { impl } = await createImpl({
            implicitDefaultLocale: { pathMatcher: null },
            autoDetectLocale: "off",
          });
          const proxy = impl.createProxy() as AnyProxyFn;

          proxy(createMockRequest("/anything"));

          expect(mockRewrite).toHaveBeenCalledOnce();
        });
      });
    });

    // -------------------------------------------------------------------
    // Cookie handling in proxy
    // -------------------------------------------------------------------

    describe("cookie handling in proxy", () => {
      it("reads locale from a custom-named cookie", async () => {
        const { impl } = await createImpl({
          atlas: aboutAtlas,
          cookie: { name: "MY_LOCALE" },
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/it/chi-siamo", { cookie: "it", cookieName: "MY_LOCALE" }));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });

      it("uses cookie name from defaultCookieDeclaration when cookie is 'on'", async () => {
        const { impl } = await createImpl({ cookie: "on", matchLocaleReturn: "it" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/", { cookie: "it", cookieName: "rm-locale" }));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/it/");
      });

      it("skips cookie when cookie is disabled", async () => {
        const { impl, rMachine } = await createImpl({ cookie: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/", { cookie: "it" }));

        expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).toHaveBeenCalledOnce();
      });

      it("returns undefined for cookie with unknown locale", async () => {
        const { impl, rMachine } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/", { cookie: "fr" }));

        expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).toHaveBeenCalledOnce();
      });
    });

    // -------------------------------------------------------------------
    // localeLabel effects on proxy
    // -------------------------------------------------------------------

    describe("localeLabel effects", () => {
      it("lowercases locale in rewrite URL when localeLabel is 'lowercase'", async () => {
        const rMachine = createMockMachineForProxy({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" });
        const config = createMockStrategyConfig({
          localeLabel: "lowercase",
          autoDetectLocale: "off",
        });
        const atlas = createMockAtlas();
        const pathTranslator = new HrefTranslator(atlas, ["en-US", "it-IT"], "en-US");
        const pathCanonicalizer = new HrefCanonicalizer(atlas, ["en-US", "it-IT"], "en-US");

        const impl = await createNextAppPathServerImpl(rMachine, config, pathTranslator, pathCanonicalizer);
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en-US/about"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en-us/about");
      });

      it("preserves locale case in rewrite URL when localeLabel is 'strict'", async () => {
        const rMachine = createMockMachineForProxy({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" });
        const config = createMockStrategyConfig({
          localeLabel: "strict",
          autoDetectLocale: "off",
        });
        const atlas = createMockAtlas();
        const pathTranslator = new HrefTranslator(atlas, ["en-US", "it-IT"], "en-US");
        const pathCanonicalizer = new HrefCanonicalizer(atlas, ["en-US", "it-IT"], "en-US");

        const impl = await createNextAppPathServerImpl(rMachine, config, pathTranslator, pathCanonicalizer);
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en-US/about"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en-US/about");
      });

      it("lowercases locale in redirect URL", async () => {
        const rMachine = createMockMachineForProxy({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" });
        (rMachine.localeHelper.matchLocalesForAcceptLanguageHeader as ReturnType<typeof vi.fn>).mockReturnValue(
          "it-IT"
        );
        const config = createMockStrategyConfig({
          localeLabel: "lowercase",
          autoDetectLocale: "on",
          implicitDefaultLocale: "off",
          cookie: "off",
        });
        const atlas = createMockAtlas();
        const pathTranslator = new HrefTranslator(atlas, ["en-US", "it-IT"], "en-US");
        const pathCanonicalizer = new HrefCanonicalizer(atlas, ["en-US", "it-IT"], "en-US");

        const impl = await createNextAppPathServerImpl(rMachine, config, pathTranslator, pathCanonicalizer);
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about"));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/it-it/about");
      });

      it("preserves locale case in redirect URL when localeLabel is 'strict'", async () => {
        const rMachine = createMockMachineForProxy({ locales: ["en-US", "it-IT"], defaultLocale: "en-US" });
        (rMachine.localeHelper.matchLocalesForAcceptLanguageHeader as ReturnType<typeof vi.fn>).mockReturnValue(
          "it-IT"
        );
        const config = createMockStrategyConfig({
          localeLabel: "strict",
          autoDetectLocale: "on",
          implicitDefaultLocale: "off",
          cookie: "off",
        });
        const atlas = createMockAtlas();
        const pathTranslator = new HrefTranslator(atlas, ["en-US", "it-IT"], "en-US");
        const pathCanonicalizer = new HrefCanonicalizer(atlas, ["en-US", "it-IT"], "en-US");

        const impl = await createNextAppPathServerImpl(rMachine, config, pathTranslator, pathCanonicalizer);
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about"));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/it-IT/about");
      });
    });

    // -------------------------------------------------------------------
    // basePath effects
    // -------------------------------------------------------------------

    describe("basePath effects", () => {
      it("prepends basePath to redirect URL", async () => {
        const { impl } = await createImpl({
          basePath: "/app",
          matchLocaleReturn: "it",
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about"));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/app/it/about");
      });

      it("prepends basePath to implicit redirect URL", async () => {
        const { impl } = await createImpl({
          basePath: "/app",
          implicitDefaultLocale: "on",
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en/about"));

        expect(mockRedirectResponse).toHaveBeenCalledOnce();
        const [url] = mockRedirectResponse.mock.calls[0] as [URL];
        expect(url.pathname).toBe("/app/about");
      });

      it("does not prepend basePath to rewrite URL", async () => {
        const { impl } = await createImpl({
          atlas: aboutAtlas,
          basePath: "/app",
          autoDetectLocale: "off",
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/it/chi-siamo"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });
    });

    // -------------------------------------------------------------------
    // URL rewriting
    // -------------------------------------------------------------------

    describe("URL rewriting", () => {
      it("rewrites pathname to /{locale}{canonicalPath}", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas, autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/it/chi-siamo"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });

      it("rewrites root path correctly", async () => {
        const { impl } = await createImpl({ autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en/"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/");
      });

      it("rewrites nested paths correctly", async () => {
        const { impl } = await createImpl({ atlas: aboutWithTeamAtlas, autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/it/chi-siamo/staff"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about/team");
      });

      it("rewrites catch-all paths to canonical form", async () => {
        const { impl } = await createImpl({ atlas: docsWithCatchAllAtlas, autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en/docs/getting-started/install"));

        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/docs/getting-started/install");
      });

      it("rewrites translated catch-all paths back to canonical form", async () => {
        const { impl } = await createImpl({ atlas: docsWithCatchAllAtlas, autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/it/documenti/getting-started/install"));

        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/docs/getting-started/install");
      });

      it("rewrites optional catch-all base path without slug", async () => {
        const { impl } = await createImpl({
          atlas: docsWithOptionalCatchAllAtlas,
          autoDetectLocale: "off",
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/it/documenti"));

        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/docs");
      });
    });

    // -------------------------------------------------------------------
    // Header management
    // -------------------------------------------------------------------

    describe("header management", () => {
      it("sets x-rm-sccpath for static canonical paths", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas, autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en/about"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(options).toBeDefined();
        const headers = options!.request.headers;
        expect(headers.get("x-rm-sccpath")).toBe("/about");
      });

      it("sets x-rm-locale when autoLocaleBinding is on", async () => {
        const { impl } = await createImpl({ autoLocaleBinding: "on", autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/it/"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(options).toBeDefined();
        const headers = options!.request.headers;
        expect(headers.get("x-rm-locale")).toBe("it");
      });

      it("sets both headers when path is static and autoLocaleBinding is on", async () => {
        const { impl } = await createImpl({
          atlas: aboutAtlas,
          autoLocaleBinding: "on",
          autoDetectLocale: "off",
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/en/about"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        const headers = options!.request.headers;
        expect(headers.get("x-rm-sccpath")).toBe("/about");
        expect(headers.get("x-rm-locale")).toBe("en");
      });

      it("sets only x-rm-locale when path is dynamic and autoLocaleBinding is on", async () => {
        const dynamicCanonicalizer = {
          get: vi.fn().mockReturnValue({ value: "/products/[id]", dynamic: true }),
        } as unknown as HrefCanonicalizer;
        const { impl } = await createImpl({
          autoLocaleBinding: "on",
          autoDetectLocale: "off",
          pathCanonicalizer: dynamicCanonicalizer,
        });

        const proxy = impl.createProxy() as AnyProxyFn;
        proxy(createMockRequest("/en/products/42"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(options).toBeDefined();
        const headers = options!.request.headers;
        expect(headers.get("x-rm-locale")).toBe("en");
        expect(headers.get("x-rm-sccpath")).toBeNull();
      });

      it("omits locale and canonical path headers for dynamic paths when autoLocaleBinding is off", async () => {
        const dynamicCanonicalizer = {
          get: vi.fn().mockReturnValue({ value: "/products/[id]", dynamic: true }),
        } as unknown as HrefCanonicalizer;
        const { impl } = await createImpl({
          autoLocaleBinding: "off",
          autoDetectLocale: "off",
          pathCanonicalizer: dynamicCanonicalizer,
        });

        const proxy = impl.createProxy() as AnyProxyFn;
        proxy(createMockRequest("/en/products/42"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        const headers = options?.request?.headers;
        expect(headers?.get("x-rm-sccpath") ?? null).toBeNull();
        expect(headers?.get("x-rm-locale") ?? null).toBeNull();
      });

      it("preserves original request headers in rewrite", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas, autoDetectLocale: "off" });
        const proxy = impl.createProxy() as AnyProxyFn;

        const request = createMockRequest("/en/about", { acceptLanguage: "en-US" });
        proxy(request);

        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        const rewriteHeaders = options!.request.headers;
        expect(rewriteHeaders.get("accept-language")).toBe("en-US");
        expect(rewriteHeaders.get("x-rm-sccpath")).toBe("/about");
      });
    });
  });

  // -----------------------------------------------------------------------
  // createRouteHandlers
  // -----------------------------------------------------------------------

  describe("createRouteHandlers", () => {
    it("throws when implicitDefaultLocale is on", async () => {
      const { impl } = await createImpl({
        implicitDefaultLocale: "on",
        autoLocaleBinding: "off",
      });

      expect(() => impl.createRouteHandlers(vi.fn() as any, vi.fn() as any, vi.fn() as any)).toThrow(
        "implicitDefaultLocale is on"
      );
    });

    it("throws when autoLocaleBinding is on", async () => {
      const { impl } = await createImpl({
        implicitDefaultLocale: "off",
        autoLocaleBinding: "on",
      });

      expect(() => impl.createRouteHandlers(vi.fn() as any, vi.fn() as any, vi.fn() as any)).toThrow(
        "autoLocaleBinding is on"
      );
    });

    it("throws with implicitDefaultLocale checked first", async () => {
      const { impl } = await createImpl({
        implicitDefaultLocale: "on",
        autoLocaleBinding: "on",
      });

      expect(() => impl.createRouteHandlers(vi.fn() as any, vi.fn() as any, vi.fn() as any)).toThrow(
        "implicitDefaultLocale is on"
      );
    });

    it("returns entrance route handlers when config is valid", async () => {
      const { impl } = await createImpl({
        implicitDefaultLocale: "off",
        autoLocaleBinding: "off",
      });

      const handlers = impl.createRouteHandlers(vi.fn() as any, vi.fn() as any, vi.fn() as any) as AnyRouteHandlers;

      expect(handlers).toHaveProperty("entrance");
      expect(handlers).toHaveProperty("entrance.GET");
      expect(typeof handlers.entrance.GET).toBe("function");
    });

    it("entrance.GET calls setLocale with cookie locale first, then with detected locale", async () => {
      const { impl } = await createImpl({
        implicitDefaultLocale: "off",
        autoLocaleBinding: "off",
      });
      const cookiesFn = createMockCookiesGetFn({ cookie: "it" });
      const headersFn = createMockHeadersFn({ "accept-language": "en" });
      const setLocale = vi.fn(async () => {});

      const handlers = impl.createRouteHandlers(cookiesFn, headersFn, setLocale) as AnyRouteHandlers;
      await handlers.entrance.GET();

      expect(setLocale).toHaveBeenCalledTimes(2);
      expect(setLocale).toHaveBeenNthCalledWith(1, "it");
      expect(setLocale).toHaveBeenNthCalledWith(2, "en");
    });

    it("entrance.GET does not reach Accept-Language detection when setLocale redirects on cookie locale", async () => {
      const { impl, rMachine } = await createImpl({
        implicitDefaultLocale: "off",
        autoLocaleBinding: "off",
      });
      const cookiesFn = createMockCookiesGetFn({ cookie: "it" });
      const headersFn = createMockHeadersFn({ "accept-language": "en" });
      const redirectError = new Error("NEXT_REDIRECT");
      const setLocale = vi.fn(async () => {
        throw redirectError;
      });

      const handlers = impl.createRouteHandlers(cookiesFn, headersFn, setLocale) as AnyRouteHandlers;
      await expect(handlers.entrance.GET()).rejects.toThrow(redirectError);

      expect(setLocale).toHaveBeenCalledOnce();
      expect(setLocale).toHaveBeenCalledWith("it");
      expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).not.toHaveBeenCalled();
    });

    it("entrance.GET calls setLocale with Accept-Language detected locale", async () => {
      const { impl, rMachine } = await createImpl({
        implicitDefaultLocale: "off",
        autoLocaleBinding: "off",
        matchLocaleReturn: "it",
      });
      const cookiesFn = createMockCookiesGetFn();
      const headersFn = createMockHeadersFn({ "accept-language": "it-IT" });
      const setLocale = vi.fn(async () => {});

      const handlers = impl.createRouteHandlers(cookiesFn, headersFn, setLocale) as AnyRouteHandlers;
      await handlers.entrance.GET();

      expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).toHaveBeenCalledWith("it-IT");
      expect(setLocale).toHaveBeenCalledWith("it");
    });

    it("entrance.GET skips cookie setLocale when no cookie is present", async () => {
      const { impl } = await createImpl({
        implicitDefaultLocale: "off",
        autoLocaleBinding: "off",
      });
      const cookiesFn = createMockCookiesGetFn();
      const headersFn = createMockHeadersFn();
      const setLocale = vi.fn(async () => {});

      const handlers = impl.createRouteHandlers(cookiesFn, headersFn, setLocale) as AnyRouteHandlers;
      await handlers.entrance.GET();

      expect(setLocale).toHaveBeenCalledOnce();
      expect(setLocale).toHaveBeenCalledWith("en");
    });

    it("entrance.GET ignores unknown cookie locale", async () => {
      const { impl } = await createImpl({
        implicitDefaultLocale: "off",
        autoLocaleBinding: "off",
      });
      const cookiesFn = createMockCookiesGetFn({ cookie: "fr" });
      const headersFn = createMockHeadersFn();
      const setLocale = vi.fn(async () => {});

      const handlers = impl.createRouteHandlers(cookiesFn, headersFn, setLocale) as AnyRouteHandlers;
      await handlers.entrance.GET();

      expect(setLocale).toHaveBeenCalledOnce();
      expect(setLocale).toHaveBeenCalledWith("en");
    });

    it("entrance.GET skips cookie entirely when cookie is disabled", async () => {
      const { impl } = await createImpl({
        implicitDefaultLocale: "off",
        autoLocaleBinding: "off",
        cookie: "off",
      });
      const cookiesFn = vi.fn();
      const headersFn = createMockHeadersFn();
      const setLocale = vi.fn(async () => {});

      const handlers = impl.createRouteHandlers(cookiesFn, headersFn, setLocale) as AnyRouteHandlers;
      await handlers.entrance.GET();

      expect(cookiesFn).not.toHaveBeenCalled();
      expect(setLocale).toHaveBeenCalledOnce();
      expect(setLocale).toHaveBeenCalledWith("en");
    });
  });

  // -----------------------------------------------------------------------
  // createBoundPathComposerSupplier
  // -----------------------------------------------------------------------

  describe("createBoundPathComposerSupplier", () => {
    it("ensures getPathComposer is restricted to server-only usage", async () => {
      const { impl } = await createImpl();
      const supplier = impl.createBoundPathComposerSupplier(async () => "en") as AnySupplierFn;

      await supplier();

      expect(validateServerOnlyUsage).toHaveBeenCalledWith("getPathComposer");
    });

    it("supplies a callable path composer", async () => {
      const { impl } = await createImpl();
      const supplier = impl.createBoundPathComposerSupplier(async () => "en") as AnySupplierFn;

      const composer = await supplier();

      expect(typeof composer).toBe("function");
    });

    it("composer translates static paths for the current locale", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });

      const supplierEn = impl.createBoundPathComposerSupplier(async () => "en") as AnySupplierFn;
      const supplierIt = impl.createBoundPathComposerSupplier(async () => "it") as AnySupplierFn;
      const composerEn = await supplierEn();
      const composerIt = await supplierIt();

      expect(composerEn("/about")).toBe("/about");
      expect(composerIt("/about")).toBe("/chi-siamo");
    });

    it("composer substitutes params in dynamic paths", async () => {
      const { impl } = await createImpl({ atlas: productsAtlas });

      const supplierEn = impl.createBoundPathComposerSupplier(async () => "en") as AnySupplierFn;
      const supplierIt = impl.createBoundPathComposerSupplier(async () => "it") as AnySupplierFn;
      const composerEn = await supplierEn();
      const composerIt = await supplierIt();

      expect(composerEn("/products/[id]", { id: "99" })).toBe("/products/99");
      expect(composerIt("/products/[id]", { id: "99" })).toBe("/prodotti/99");
    });

    it("composer handles nested paths", async () => {
      const { impl } = await createImpl({ atlas: aboutWithTeamAtlas });

      const supplier = impl.createBoundPathComposerSupplier(async () => "it") as AnySupplierFn;
      const composer = await supplier();

      expect(composer("/about/team")).toBe("/chi-siamo/staff");
    });

    it("composer handles root path", async () => {
      const { impl } = await createImpl();

      const supplier = impl.createBoundPathComposerSupplier(async () => "en") as AnySupplierFn;
      const composer = await supplier();

      expect(composer("/")).toBe("/");
    });

    it("composer handles catch-all paths with array params", async () => {
      const { impl } = await createImpl({ atlas: docsWithCatchAllAtlas });

      const supplierEn = impl.createBoundPathComposerSupplier(async () => "en") as AnySupplierFn;
      const supplierIt = impl.createBoundPathComposerSupplier(async () => "it") as AnySupplierFn;
      const composerEn = await supplierEn();
      const composerIt = await supplierIt();

      expect(composerEn("/docs/[...slug]", { slug: ["getting-started", "install"] })).toBe(
        "/docs/getting-started/install"
      );
      expect(composerIt("/docs/[...slug]", { slug: ["getting-started", "install"] })).toBe(
        "/documenti/getting-started/install"
      );
    });
  });
});
