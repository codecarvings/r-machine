import { afterEach, describe, expect, it, vi } from "vitest";
import { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { defaultPathMatcher, validateServerOnlyUsage } from "#r-machine/next/internal";
import { createNextAppFlatServerImpl } from "../../../../src/core/app/flat/next-app-flat.server-impl.js";
import type { AnyNextAppFlatStrategyConfig } from "../../../../src/core/app/flat/next-app-flat-strategy-core.js";
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

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

const mockRewrite = vi.fn((..._args: unknown[]) => ({ _type: "rewrite" }));
const mockNext = vi.fn((..._args: any[]) => ({ _type: "next" }));
vi.mock("next/server", () => ({
  NextResponse: {
    rewrite: (...args: any[]) => mockRewrite(...args),
    next: (...args: any[]) => mockNext(...args),
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

function createMockStrategyConfig(overrides: Partial<AnyNextAppFlatStrategyConfig> = {}) {
  return {
    localeKey: "locale",
    autoLocaleBinding: "off",
    basePath: "",
    cookie: { name: "NEXT_LOCALE", path: "/", maxAge: 31536000 },
    pathMatcher: null,
    ...overrides,
  } as AnyNextAppFlatStrategyConfig;
}

interface CreateImplOptions {
  atlas?: ReturnType<typeof createMockAtlas>;
  autoLocaleBinding?: "on" | "off";
  pathMatcher?: RegExp | null;
  localeKey?: string;
  cookieOverrides?: Partial<AnyNextAppFlatStrategyConfig["cookie"]>;
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
    pathMatcher: options.pathMatcher !== undefined ? options.pathMatcher : null,
    ...(options.localeKey !== undefined ? { localeKey: options.localeKey } : {}),
    ...(options.cookieOverrides
      ? { cookie: { name: "NEXT_LOCALE", path: "/", maxAge: 31536000, ...options.cookieOverrides } }
      : {}),
  });
  const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
  const pathCanonicalizer = options.pathCanonicalizer ?? new HrefCanonicalizer(atlas, [...locales], defaultLocale);

  const impl = await createNextAppFlatServerImpl(rMachine, strategyConfig, pathTranslator, pathCanonicalizer);

  return { impl, rMachine, strategyConfig, pathTranslator, pathCanonicalizer };
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

describe("createNextAppFlatServerImpl", () => {
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

    it("redirects to the translated path derived from x-rm-scpath header", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });
      const { cookiesFn } = createMockCookiesFn();
      const headersFn = createMockHeadersFn({ "x-rm-scpath": "/about" });

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/chi-siamo");
    });

    it("falls back to root translation when x-rm-scpath header is absent", async () => {
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
      const headersFn = createMockHeadersFn({ "x-rm-scpath": "/about/team" });

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/chi-siamo/staff");
    });

    it("translates correctly when switching from a non-default locale", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });
      const { cookiesFn } = createMockCookiesFn();
      const headersFn = createMockHeadersFn({ "x-rm-scpath": "/about" });

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
    });

    it("uses custom cookie name and config for locale storage", async () => {
      const { impl } = await createImpl({ cookieOverrides: { name: "MY_LOCALE", path: "/app" } });
      const { cookiesFn, mockSet } = createMockCookiesFn();
      const headersFn = createMockHeadersFn();

      await impl.writeLocale("en", "it", cookiesFn, headersFn);

      expect(mockSet).toHaveBeenCalledWith("MY_LOCALE", "it", expect.objectContaining({ path: "/app" }));
    });

    it("preserves undeclared paths as-is during locale switch", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });
      const { cookiesFn } = createMockCookiesFn();
      const headersFn = createMockHeadersFn({ "x-rm-scpath": "/unknown-page" });

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
  });

  // -----------------------------------------------------------------------
  // createProxy
  // -----------------------------------------------------------------------

  describe("createProxy", () => {
    // -------------------------------------------------------------------
    // Path matching
    // -------------------------------------------------------------------

    describe("path matching", () => {
      it("rewrites all paths when no pathMatcher filter is set", async () => {
        const { impl } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/any/path"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("rewrites paths matching the pathMatcher pattern", async () => {
        const { impl } = await createImpl({ pathMatcher: /^\/app/ });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/app/dashboard"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("passes through paths that do not match the pathMatcher", async () => {
        const { impl } = await createImpl({ pathMatcher: /^\/app/ });
        const proxy = impl.createProxy() as AnyProxyFn;

        const result = proxy(createMockRequest("/api/data"));

        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
        expect(result).toEqual({ _type: "next" });
      });
    });

    describe("defaultPathMatcher filtering", () => {
      it("proxies application paths", async () => {
        const { impl } = await createImpl({ pathMatcher: defaultPathMatcher });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about"));
        expect(mockRewrite).toHaveBeenCalledOnce();

        mockRewrite.mockClear();
        proxy(createMockRequest("/products/42"));
        expect(mockRewrite).toHaveBeenCalledOnce();
      });

      it("skips Next.js internal paths", async () => {
        const { impl } = await createImpl({ pathMatcher: defaultPathMatcher });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/_next/static/chunk.js"));
        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
      });

      it("skips Vercel internal paths", async () => {
        const { impl } = await createImpl({ pathMatcher: defaultPathMatcher });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/_vercel/insights"));
        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
      });

      it("skips API routes", async () => {
        const { impl } = await createImpl({ pathMatcher: defaultPathMatcher });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/api/data"));
        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
      });

      it("skips paths with file extensions", async () => {
        const { impl } = await createImpl({ pathMatcher: defaultPathMatcher });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/favicon.ico"));
        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
      });
    });

    // -------------------------------------------------------------------
    // Locale resolution
    // -------------------------------------------------------------------

    describe("locale resolution", () => {
      it("resolves locale from cookie when available", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", { cookie: "it" }));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });

      it("falls back to Accept-Language when cookie is absent", async () => {
        const { impl, rMachine } = await createImpl({ atlas: aboutAtlas, matchLocaleReturn: "it" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", { acceptLanguage: "it-IT,it;q=0.9" }));

        expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).toHaveBeenCalledWith("it-IT,it;q=0.9");
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });

      it("falls back to Accept-Language when cookie contains an unknown locale", async () => {
        const { impl, rMachine } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/", { cookie: "fr" }));

        expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/");
      });

      it("falls back to Accept-Language when no cookie is set", async () => {
        const { impl, rMachine } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/"));

        expect(rMachine.localeHelper.matchLocalesForAcceptLanguageHeader).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/");
      });

      it("reads locale from a custom-named cookie", async () => {
        const { impl } = await createImpl({
          atlas: aboutAtlas,
          cookieOverrides: { name: "MY_LOCALE" },
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", { cookie: "it", cookieName: "MY_LOCALE" }));

        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });
    });

    // -------------------------------------------------------------------
    // URL rewriting
    // -------------------------------------------------------------------

    describe("URL rewriting", () => {
      it("rewrites pathname to /{locale}{canonicalPath}", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", { cookie: "it" }));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });

      it("rewrites root path correctly", async () => {
        const { impl } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/", { cookie: "en" }));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/");
      });

      it("rewrites nested paths correctly", async () => {
        const { impl } = await createImpl({ atlas: aboutWithTeamAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/chi-siamo/staff", { cookie: "it" }));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about/team");
      });

      it("rewrites catch-all paths to canonical form", async () => {
        const { impl } = await createImpl({ atlas: docsWithCatchAllAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/docs/getting-started/install", { cookie: "en" }));

        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/docs/getting-started/install");
      });

      it("rewrites translated catch-all paths back to canonical form", async () => {
        const { impl } = await createImpl({ atlas: docsWithCatchAllAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/documenti/getting-started/install", { cookie: "it" }));

        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/docs/getting-started/install");
      });

      it("rewrites optional catch-all base path without slug", async () => {
        const { impl } = await createImpl({ atlas: docsWithOptionalCatchAllAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/documenti", { cookie: "it" }));

        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/docs");
      });
    });

    // -------------------------------------------------------------------
    // Header management
    // -------------------------------------------------------------------

    describe("header management", () => {
      it("sets x-rm-scpath for static canonical paths", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", { cookie: "en" }));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(options).toBeDefined();
        const headers = options!.request.headers;
        expect(headers.get("x-rm-scpath")).toBe("/about");
      });

      it("sets x-rm-locale when autoLocaleBinding is on", async () => {
        const { impl } = await createImpl({ autoLocaleBinding: "on" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/", { cookie: "it" }));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(options).toBeDefined();
        const headers = options!.request.headers;
        expect(headers.get("x-rm-locale")).toBe("it");
      });

      it("sets both headers when path is static and autoLocaleBinding is on", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas, autoLocaleBinding: "on" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", { cookie: "en" }));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        const headers = options!.request.headers;
        expect(headers.get("x-rm-scpath")).toBe("/about");
        expect(headers.get("x-rm-locale")).toBe("en");
      });

      it("sets only x-rm-locale when path is dynamic and autoLocaleBinding is on", async () => {
        const dynamicCanonicalizer = {
          get: vi.fn().mockReturnValue({ value: "/products/[id]", dynamic: true }),
        } as unknown as HrefCanonicalizer;
        const { impl } = await createImpl({
          autoLocaleBinding: "on",
          pathCanonicalizer: dynamicCanonicalizer,
        });

        const proxy = impl.createProxy() as AnyProxyFn;
        proxy(createMockRequest("/products/42", { cookie: "en" }));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(options).toBeDefined();
        const headers = options!.request.headers;
        expect(headers.get("x-rm-locale")).toBe("en");
        expect(headers.get("x-rm-scpath")).toBeNull();
      });

      it("omits locale and canonical path headers for dynamic paths when autoLocaleBinding is off", async () => {
        const dynamicCanonicalizer = {
          get: vi.fn().mockReturnValue({ value: "/products/[id]", dynamic: true }),
        } as unknown as HrefCanonicalizer;
        const { impl } = await createImpl({
          autoLocaleBinding: "off",
          pathCanonicalizer: dynamicCanonicalizer,
        });

        const proxy = impl.createProxy() as AnyProxyFn;
        proxy(createMockRequest("/products/42", { cookie: "en" }));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        const headers = options?.request?.headers;
        expect(headers?.get("x-rm-scpath") ?? null).toBeNull();
        expect(headers?.get("x-rm-locale") ?? null).toBeNull();
      });

      it("preserves original request headers in rewrite", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        const request = createMockRequest("/about", { cookie: "en", acceptLanguage: "en-US" });

        proxy(request);

        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        const rewriteHeaders = options!.request.headers;
        expect(rewriteHeaders.get("accept-language")).toBe("en-US");
        expect(rewriteHeaders.get("x-rm-scpath")).toBe("/about");
      });
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
