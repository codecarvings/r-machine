import type { RMachine } from "r-machine";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { validateServerOnlyUsage } from "#r-machine/next/internal";
import { createNextAppOriginServerImpl } from "../../../../src/core/app/origin/next-app-origin.server-impl.js";
import type { AnyNextAppOriginStrategyConfig } from "../../../../src/core/app/origin/next-app-origin-strategy-core.js";
import { aboutAtlas, aboutWithTeamAtlas, createMockAtlas, productsAtlas } from "../../../_fixtures/_helpers.js";
import type { TestAtlas } from "../../../_fixtures/mock-machine.js";

type AnyPathComposer = (path: string, params?: object) => string;
type AnyProxyFn = (request: unknown) => unknown;
type AnySupplierFn = () => Promise<AnyPathComposer>;
type MockRewriteArgs = [url: { pathname: string }, options?: { request: { headers: Headers } }];

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

const locales = ["en", "it"] as const;
const defaultLocale = "en";

function createMockRMachine() {
  return {
    config: { defaultLocale, locales },
  } as unknown as RMachine<TestAtlas>;
}

function createMockStrategyConfig(overrides: Partial<AnyNextAppOriginStrategyConfig> = {}) {
  return {
    localeKey: "locale",
    autoLocaleBinding: "off",
    basePath: "",
    localeOriginMap: {
      en: "https://en.example.com",
      it: "https://it.example.com",
    },
    pathMatcher: null,
    ...overrides,
  } as AnyNextAppOriginStrategyConfig;
}

interface CreateImplOptions {
  atlas?: ReturnType<typeof createMockAtlas>;
  localeOriginMap?: Record<string, string | string[]>;
  autoLocaleBinding?: "on" | "off";
  pathMatcher?: RegExp | null;
  localeKey?: string;
}

async function createImpl(options: CreateImplOptions = {}) {
  const atlas = options.atlas ?? createMockAtlas();
  const localeOriginMap = options.localeOriginMap ?? {
    en: "https://en.example.com",
    it: "https://it.example.com",
  };

  const rMachine = createMockRMachine();
  const strategyConfig = createMockStrategyConfig({
    localeOriginMap,
    autoLocaleBinding: options.autoLocaleBinding ?? "off",
    pathMatcher: options.pathMatcher !== undefined ? options.pathMatcher : null,
    ...(options.localeKey !== undefined ? { localeKey: options.localeKey } : {}),
  });
  const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
  const urlTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
  const pathCanonicalizer = new HrefCanonicalizer(atlas, [...locales], defaultLocale);

  const impl = await createNextAppOriginServerImpl(
    rMachine,
    strategyConfig,
    pathTranslator,
    urlTranslator,
    pathCanonicalizer
  );

  return { impl, rMachine, strategyConfig, pathTranslator, urlTranslator, pathCanonicalizer };
}

function createMockHeadersFn(entries: Record<string, string> = {}): any {
  const map = new Map(Object.entries(entries));
  return vi.fn(async () => ({
    get: (name: string) => map.get(name) ?? null,
  }));
}

function createMockRequest(pathname: string, protocol = "https:", host = "en.example.com") {
  const headers = new Headers();
  headers.set("host", host);
  return {
    nextUrl: {
      pathname,
      protocol,
      clone() {
        return { pathname, protocol };
      },
    },
    headers,
  };
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

describe("createNextAppOriginServerImpl", () => {
  it("returns an object conforming to NextAppServerImpl", async () => {
    const { impl } = await createImpl();

    expect(impl).toBeDefined();
    expect(typeof impl.localeKey).toBe("string");
    expect(typeof impl.autoLocaleBinding).toBe("boolean");
    expect(typeof impl.writeLocale).toBe("function");
    expect(typeof impl.createLocaleStaticParamsGenerator).toBe("function");
    expect(typeof impl.createProxy).toBe("function");
    expect(typeof impl.createBoundPathComposerSupplier).toBe("function");
  });

  it("localeKey matches strategyConfig", async () => {
    const { impl } = await createImpl({ localeKey: "lang" });

    expect(impl.localeKey).toBe("lang");
  });

  it("autoLocaleBinding is true when strategyConfig is 'on'", async () => {
    const { impl } = await createImpl({ autoLocaleBinding: "on" });

    expect(impl.autoLocaleBinding).toBe(true);
  });

  it("autoLocaleBinding is false when strategyConfig is 'off'", async () => {
    const { impl } = await createImpl({ autoLocaleBinding: "off" });

    expect(impl.autoLocaleBinding).toBe(false);
  });

  // -----------------------------------------------------------------------
  // writeLocale
  // -----------------------------------------------------------------------

  describe("writeLocale", () => {
    it("does nothing when newLocale equals locale", async () => {
      const { impl } = await createImpl();
      const headersFn = createMockHeadersFn();

      await impl.writeLocale("en", "en", vi.fn() as any, headersFn);

      expect(mockRedirect).not.toHaveBeenCalled();
      expect(headersFn).not.toHaveBeenCalled();
    });

    it("redirects using x-rm-scpath header value when present", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });
      const headersFn = createMockHeadersFn({ "x-rm-scpath": "/about" });

      await impl.writeLocale("en", "it", vi.fn() as any, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/chi-siamo");
    });

    it("falls back to root translation when x-rm-scpath header is absent", async () => {
      const { impl } = await createImpl();
      const headersFn = createMockHeadersFn();

      await impl.writeLocale("en", "it", vi.fn() as any, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/");
    });

    it("redirects correctly for nested static paths", async () => {
      const { impl } = await createImpl({ atlas: aboutWithTeamAtlas });
      const headersFn = createMockHeadersFn({ "x-rm-scpath": "/about/team" });

      await impl.writeLocale("en", "it", vi.fn() as any, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/chi-siamo/staff");
    });

    it("translates correctly when switching from a non-default locale", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });
      const headersFn = createMockHeadersFn({ "x-rm-scpath": "/about" });

      await impl.writeLocale("it", "en", vi.fn() as any, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
      expect(mockRedirect).toHaveBeenCalledWith("/about");
    });

    it("proceeds when locale is undefined", async () => {
      const { impl } = await createImpl();
      const headersFn = createMockHeadersFn();

      await impl.writeLocale(undefined, "it", vi.fn() as any, headersFn);

      expect(mockRedirect).toHaveBeenCalledOnce();
    });
  });

  // -----------------------------------------------------------------------
  // createLocaleStaticParamsGenerator
  // -----------------------------------------------------------------------

  describe("createLocaleStaticParamsGenerator", () => {
    it("returns a generator that maps locales with localeKey", async () => {
      const { impl } = await createImpl();
      const generator = impl.createLocaleStaticParamsGenerator() as () => Promise<Record<string, string>[]>;
      const params = await generator();

      expect(params).toEqual([{ locale: "en" }, { locale: "it" }]);
    });

    it("uses custom localeKey from strategyConfig", async () => {
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
      it("handles all paths when pathMatcher is null", async () => {
        const { impl } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/any/path"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("handles matching paths when pathMatcher is set", async () => {
        const { impl } = await createImpl({ pathMatcher: /^\/app/ });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/app/dashboard"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("returns NextResponse.next() for non-matching paths", async () => {
        const { impl } = await createImpl({ pathMatcher: /^\/app/ });
        const proxy = impl.createProxy() as AnyProxyFn;

        const result = proxy(createMockRequest("/api/data"));

        expect(mockNext).toHaveBeenCalledOnce();
        expect(mockRewrite).not.toHaveBeenCalled();
        expect(result).toEqual({ _type: "next" });
      });
    });

    // -------------------------------------------------------------------
    // Locale resolution
    // -------------------------------------------------------------------

    describe("locale resolution", () => {
      it("resolves locale from string origin in localeOriginMap", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", "https:", "it.example.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });

      it("resolves locale from array of origins in localeOriginMap", async () => {
        const { impl } = await createImpl({
          atlas: aboutAtlas,
          localeOriginMap: {
            en: ["https://en.example.com", "https://www.example.com"],
            it: ["https://it.example.com", "https://esempio.com"],
          },
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", "https:", "esempio.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });

      it("falls back to defaultLocale when origin not found", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", "https:", "unknown.example.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/about");
      });

      it("constructs origin from protocol and host header", async () => {
        const { impl } = await createImpl({
          localeOriginMap: {
            en: "http://localhost:3000",
            it: "http://localhost:3001",
          },
        });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/", "http:", "localhost:3001"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/");
      });

      it("resolves the same locale for repeated requests from the same origin", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/about", "https:", "it.example.com"));
        proxy(createMockRequest("/", "https:", "it.example.com"));

        expect(mockRewrite).toHaveBeenCalledTimes(2);
        const [url1] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        const [url2] = mockRewrite.mock.calls[1] as MockRewriteArgs;
        expect(url1.pathname).toBe("/it/about");
        expect(url2.pathname).toBe("/it/");
      });
    });

    // -------------------------------------------------------------------
    // URL rewriting
    // -------------------------------------------------------------------

    describe("URL rewriting", () => {
      it("rewrites pathname to /{locale}{canonicalPath}", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/chi-siamo", "https:", "it.example.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about");
      });

      it("rewrites root path correctly", async () => {
        const { impl } = await createImpl();
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/", "https:", "en.example.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/en/");
      });

      it("rewrites nested paths correctly", async () => {
        const { impl } = await createImpl({ atlas: aboutWithTeamAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/chi-siamo/staff", "https:", "it.example.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [url] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(url.pathname).toBe("/it/about/team");
      });
    });

    // -------------------------------------------------------------------
    // Header management
    // -------------------------------------------------------------------

    describe("header management", () => {
      it("sets x-rm-scpath for static canonical paths", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/chi-siamo", "https:", "it.example.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(options).toBeDefined();
        const headers = options!.request.headers;
        expect(headers.get("x-rm-scpath")).toBe("/about");
      });

      it("sets x-rm-locale when autoLocaleBinding is on", async () => {
        const { impl } = await createImpl({ autoLocaleBinding: "on" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/", "https:", "it.example.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(options).toBeDefined();
        const headers = options!.request.headers;
        expect(headers.get("x-rm-locale")).toBe("it");
      });

      it("sets both headers when path is static and autoLocaleBinding is on", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas, autoLocaleBinding: "on" });
        const proxy = impl.createProxy() as AnyProxyFn;

        proxy(createMockRequest("/chi-siamo", "https:", "it.example.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        const headers = options!.request.headers;
        expect(headers.get("x-rm-scpath")).toBe("/about");
        expect(headers.get("x-rm-locale")).toBe("it");
      });

      it("sets only x-rm-locale when path is dynamic and autoLocaleBinding is on", async () => {
        const rMachine = createMockRMachine();
        const strategyConfig = createMockStrategyConfig({ autoLocaleBinding: "on" });
        const atlas = createMockAtlas();
        const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
        const urlTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
        const mockCanonicalizerGet = vi.fn().mockReturnValue({ value: "/products/[id]", dynamic: true });
        const pathCanonicalizer = { get: mockCanonicalizerGet } as unknown as HrefCanonicalizer;

        const impl = await createNextAppOriginServerImpl(
          rMachine,
          strategyConfig,
          pathTranslator,
          urlTranslator,
          pathCanonicalizer
        );

        const proxy = impl.createProxy() as AnyProxyFn;
        proxy(createMockRequest("/products/42", "https:", "en.example.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(options).toBeDefined();
        const headers = options!.request.headers;
        expect(headers.get("x-rm-locale")).toBe("en");
        expect(headers.get("x-rm-scpath")).toBeNull();
      });

      it("does not modify headers when path is dynamic and autoLocaleBinding is off", async () => {
        const rMachine = createMockRMachine();
        const strategyConfig = createMockStrategyConfig({ autoLocaleBinding: "off" });
        const atlas = createMockAtlas();
        const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
        const urlTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
        const mockCanonicalizerGet = vi.fn().mockReturnValue({ value: "/products/[id]", dynamic: true });
        const pathCanonicalizer = { get: mockCanonicalizerGet } as unknown as HrefCanonicalizer;

        const impl = await createNextAppOriginServerImpl(
          rMachine,
          strategyConfig,
          pathTranslator,
          urlTranslator,
          pathCanonicalizer
        );

        const proxy = impl.createProxy() as AnyProxyFn;
        proxy(createMockRequest("/products/42", "https:", "en.example.com"));

        expect(mockRewrite).toHaveBeenCalledOnce();
        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        expect(options).toBeUndefined();
      });

      it("preserves original request headers in rewrite", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const proxy = impl.createProxy() as AnyProxyFn;

        const headers = new Headers();
        headers.set("host", "it.example.com");
        headers.set("accept-language", "it");

        const request = {
          nextUrl: {
            pathname: "/chi-siamo",
            protocol: "https:",
            clone() {
              return { pathname: "/chi-siamo", protocol: "https:" };
            },
          },
          headers,
        };

        proxy(request);

        const [, options] = mockRewrite.mock.calls[0] as MockRewriteArgs;
        const rewriteHeaders = options!.request.headers;
        expect(rewriteHeaders.get("accept-language")).toBe("it");
        expect(rewriteHeaders.get("x-rm-scpath")).toBe("/about");
      });
    });
  });

  // -----------------------------------------------------------------------
  // createBoundPathComposerSupplier
  // -----------------------------------------------------------------------

  describe("createBoundPathComposerSupplier", () => {
    it("calls validateServerOnlyUsage", async () => {
      const { impl } = await createImpl();
      const supplier = impl.createBoundPathComposerSupplier(async () => "en") as AnySupplierFn;

      await supplier();

      expect(validateServerOnlyUsage).toHaveBeenCalledWith("getPathComposer");
    });

    it("returns a path composer function", async () => {
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
  });

  // -----------------------------------------------------------------------
  // Translator delegation
  // -----------------------------------------------------------------------

  describe("translator delegation", () => {
    it("writeLocale uses urlTranslator for URL composition", async () => {
      const rMachine = createMockRMachine();
      const strategyConfig = createMockStrategyConfig();
      const atlas = aboutAtlas;
      const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
      const pathCanonicalizer = new HrefCanonicalizer(atlas, [...locales], defaultLocale);

      const urlTranslatorGet = vi.fn().mockReturnValue({ value: "https://it.example.com/chi-siamo", dynamic: false });
      const urlTranslator = { get: urlTranslatorGet } as unknown as HrefTranslator;

      const impl = await createNextAppOriginServerImpl(
        rMachine,
        strategyConfig,
        pathTranslator,
        urlTranslator,
        pathCanonicalizer
      );

      const headersFn = createMockHeadersFn({ "x-rm-scpath": "/about" });
      await impl.writeLocale("en", "it", vi.fn() as any, headersFn);

      expect(urlTranslatorGet).toHaveBeenCalledWith("it", "/about");
      expect(mockRedirect).toHaveBeenCalledWith("https://it.example.com/chi-siamo");
    });

    it("createBoundPathComposerSupplier uses pathTranslator for composition", async () => {
      const rMachine = createMockRMachine();
      const strategyConfig = createMockStrategyConfig();
      const atlas = aboutAtlas;
      const pathCanonicalizer = new HrefCanonicalizer(atlas, [...locales], defaultLocale);
      const urlTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);

      const pathTranslatorGet = vi.fn().mockReturnValue({ value: "/custom-path", dynamic: false });
      const pathTranslator = { get: pathTranslatorGet } as unknown as HrefTranslator;

      const impl = await createNextAppOriginServerImpl(
        rMachine,
        strategyConfig,
        pathTranslator,
        urlTranslator,
        pathCanonicalizer
      );

      const supplier = impl.createBoundPathComposerSupplier(async () => "it") as AnySupplierFn;
      const composer = await supplier();
      const result = composer("/about");

      expect(pathTranslatorGet).toHaveBeenCalledWith("it", "/about", undefined);
      expect(result).toBe("/custom-path");
    });

    it("createProxy uses pathCanonicalizer for canonical path resolution", async () => {
      const rMachine = createMockRMachine();
      const strategyConfig = createMockStrategyConfig();
      const atlas = aboutAtlas;
      const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
      const urlTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);

      const canonicalizerGet = vi.fn().mockReturnValue({ value: "/about", dynamic: false });
      const pathCanonicalizer = { get: canonicalizerGet } as unknown as HrefCanonicalizer;

      const impl = await createNextAppOriginServerImpl(
        rMachine,
        strategyConfig,
        pathTranslator,
        urlTranslator,
        pathCanonicalizer
      );

      const proxy = impl.createProxy() as AnyProxyFn;
      proxy(createMockRequest("/chi-siamo", "https:", "it.example.com"));

      expect(canonicalizerGet).toHaveBeenCalledWith("it", "/chi-siamo");
    });
  });
});
