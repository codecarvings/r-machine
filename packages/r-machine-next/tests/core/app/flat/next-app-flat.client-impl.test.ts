import { afterEach, describe, expect, it, vi } from "vitest";
import { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { createNextAppFlatClientImpl } from "../../../../src/core/app/flat/next-app-flat.client-impl.js";
import type { AnyNextAppFlatStrategyConfig } from "../../../../src/core/app/flat/next-app-flat-strategy-core.js";
import {
  aboutAtlas,
  aboutWithTeamAtlas,
  createMockAtlas,
  docsWithCatchAllAtlas,
  productsAtlas,
} from "../../../_fixtures/_helpers.js";
import { TEST_DEFAULT_LOCALE as defaultLocale, TEST_LOCALES as locales } from "../../../_fixtures/constants.js";
import { createMockMachine } from "../../../_fixtures/mock-machine.js";
import { createMockRouter } from "../../../_fixtures/mock-router.js";
import type { AnyPathComposer } from "../../../_fixtures/test-types.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSetCookie = vi.fn();

vi.mock("#r-machine/next/internal", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#r-machine/next/internal")>();
  return {
    ...actual,
    setCookie: (...args: unknown[]) => mockSetCookie(...args),
  };
});

const mockCookiesGet = vi.fn<(name: string) => string | undefined>();

vi.mock("js-cookie", () => ({
  default: { get: (name: string) => mockCookiesGet(name) },
}));

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
  cookieOverrides?: Partial<AnyNextAppFlatStrategyConfig["cookie"]>;
}

async function createImpl(options: CreateImplOptions = {}) {
  const atlas = options.atlas ?? createMockAtlas();

  const rMachine = createMockMachine();
  const strategyConfig = createMockStrategyConfig(
    options.cookieOverrides
      ? { cookie: { name: "NEXT_LOCALE", path: "/", maxAge: 31536000, ...options.cookieOverrides } }
      : undefined
  );
  const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
  const pathCanonicalizer = new HrefCanonicalizer(atlas, [...locales], defaultLocale);

  const impl = await createNextAppFlatClientImpl(rMachine, strategyConfig, pathTranslator, pathCanonicalizer);

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

describe("createNextAppFlatClientImpl", () => {
  // -----------------------------------------------------------------------
  // onLoad
  // -----------------------------------------------------------------------

  describe("onLoad", () => {
    it("syncs cookie to the current locale when mismatched", async () => {
      const { impl } = await createImpl();
      mockCookiesGet.mockReturnValue("it");

      impl.onLoad!("en");

      expect(mockCookiesGet).toHaveBeenCalledWith("NEXT_LOCALE");
      expect(mockSetCookie).toHaveBeenCalledWith("NEXT_LOCALE", "en", expect.objectContaining({ path: "/" }));
    });

    it("skips cookie update when locale already matches", async () => {
      const { impl } = await createImpl();
      mockCookiesGet.mockReturnValue("en");

      impl.onLoad!("en");

      expect(mockCookiesGet).toHaveBeenCalledWith("NEXT_LOCALE");
      expect(mockSetCookie).not.toHaveBeenCalled();
    });

    it("initializes cookie with the current locale when not yet set", async () => {
      const { impl } = await createImpl();
      mockCookiesGet.mockReturnValue(undefined);

      impl.onLoad!("en");

      expect(mockSetCookie).toHaveBeenCalledWith("NEXT_LOCALE", "en", expect.objectContaining({ path: "/" }));
    });

    it("reads and writes using the custom cookie name from config", async () => {
      const { impl } = await createImpl({ cookieOverrides: { name: "MY_LOCALE" } });
      mockCookiesGet.mockReturnValue("it");

      impl.onLoad!("en");

      expect(mockCookiesGet).toHaveBeenCalledWith("MY_LOCALE");
      expect(mockSetCookie).toHaveBeenCalledWith("MY_LOCALE", "en", expect.objectContaining({ path: "/" }));
    });
  });

  // -----------------------------------------------------------------------
  // writeLocale
  // -----------------------------------------------------------------------

  describe("writeLocale", () => {
    it("does nothing when newLocale equals current locale", async () => {
      const { impl } = await createImpl();
      const router = createMockRouter();

      impl.writeLocale("en", "en", "/about", router as any);

      expect(mockSetCookie).not.toHaveBeenCalled();
      expect(router.push).not.toHaveBeenCalled();
      expect(router.refresh).not.toHaveBeenCalled();
    });

    it("triggers a router refresh after every locale change", async () => {
      const { impl } = await createImpl();
      const router = createMockRouter();

      impl.writeLocale("en", "it", "/", router as any);

      expect(router.refresh).toHaveBeenCalledOnce();
    });

    it("persists the new locale in a cookie", async () => {
      const { impl } = await createImpl();
      const router = createMockRouter();

      impl.writeLocale("en", "it", "/", router as any);

      expect(mockSetCookie).toHaveBeenCalledWith("NEXT_LOCALE", "it", expect.objectContaining({ path: "/" }));
    });

    it("uses custom cookie name and path when writing locale", async () => {
      const { impl } = await createImpl({ cookieOverrides: { name: "MY_LOCALE", path: "/app" } });
      const router = createMockRouter();

      impl.writeLocale("en", "it", "/", router as any);

      expect(mockSetCookie).toHaveBeenCalledWith("MY_LOCALE", "it", expect.objectContaining({ path: "/app" }));
    });

    it("persists cookie before navigating to the translated path", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });
      const router = createMockRouter();

      impl.writeLocale("en", "it", "/about", router as any);

      const setCookieOrder = mockSetCookie.mock.invocationCallOrder[0];
      const pushOrder = router.push.mock.invocationCallOrder[0];
      expect(setCookieOrder).toBeLessThan(pushOrder);
    });

    describe("with static paths", () => {
      it("navigates to the translated path for root", async () => {
        const { impl } = await createImpl();
        const router = createMockRouter();

        impl.writeLocale("en", "it", "/", router as any);

        expect(router.push).not.toHaveBeenCalled();
        expect(router.refresh).toHaveBeenCalledOnce();
      });

      it("navigates to the translated path for a declared path", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const router = createMockRouter();

        impl.writeLocale("en", "it", "/about", router as any);

        expect(router.push).toHaveBeenCalledOnce();
        expect(router.push).toHaveBeenCalledWith("/chi-siamo");
      });

      it("navigates to the translated path when switching from a translated path", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const router = createMockRouter();

        impl.writeLocale("it", "en", "/chi-siamo", router as any);

        expect(router.push).toHaveBeenCalledOnce();
        expect(router.push).toHaveBeenCalledWith("/about");
      });

      it("navigates correctly for nested static paths", async () => {
        const { impl } = await createImpl({ atlas: aboutWithTeamAtlas });
        const router = createMockRouter();

        impl.writeLocale("en", "it", "/about/team", router as any);

        expect(router.push).toHaveBeenCalledOnce();
        expect(router.push).toHaveBeenCalledWith("/chi-siamo/staff");
      });

      it("skips navigation when translated path matches current pathname", async () => {
        const { impl } = await createImpl();
        const router = createMockRouter();

        // "/" translates to "/" for any locale in empty atlas
        impl.writeLocale("en", "it", "/", router as any);

        expect(router.push).not.toHaveBeenCalled();
        expect(router.refresh).toHaveBeenCalledOnce();
      });
    });

    describe("with dynamic paths", () => {
      it("falls back to root when current path is dynamic", async () => {
        const { impl } = await createImpl({ atlas: productsAtlas });
        const router = createMockRouter();

        impl.writeLocale("en", "it", "/products/42", router as any);

        expect(router.push).toHaveBeenCalledOnce();
        expect(router.push).toHaveBeenCalledWith("/");
      });

      it("falls back to translated root when switching from a dynamic path", async () => {
        const { impl } = await createImpl({ atlas: productsAtlas });
        const router = createMockRouter();

        impl.writeLocale("it", "en", "/prodotti/42", router as any);

        expect(router.push).toHaveBeenCalledOnce();
        expect(router.push).toHaveBeenCalledWith("/");
      });
    });

    describe("with undeclared paths", () => {
      it("skips navigation when undeclared path resolves to itself", async () => {
        const { impl } = await createImpl();
        const router = createMockRouter();

        impl.writeLocale("en", "it", "/unknown-page", router as any);

        expect(router.push).not.toHaveBeenCalled();
        expect(router.refresh).toHaveBeenCalledOnce();
      });
    });
  });

  // -----------------------------------------------------------------------
  // createUsePathComposer
  // -----------------------------------------------------------------------

  describe("createUsePathComposer", () => {
    it("returns a hook factory function", async () => {
      const { impl } = await createImpl();

      const usePathComposer = impl.createUsePathComposer(() => "en");

      expect(typeof usePathComposer).toBe("function");
    });

    it("the hook returns a path composer function", async () => {
      const { impl } = await createImpl();

      const composer = impl.createUsePathComposer(() => "en")();

      expect(typeof composer).toBe("function");
    });

    it("composer translates static paths for the current locale", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });

      const composerEn = impl.createUsePathComposer(() => "en")() as AnyPathComposer;
      const composerIt = impl.createUsePathComposer(() => "it")() as AnyPathComposer;

      expect(composerEn("/about")).toBe("/about");
      expect(composerIt("/about")).toBe("/chi-siamo");
    });

    it("composer substitutes params in dynamic paths", async () => {
      const { impl } = await createImpl({ atlas: productsAtlas });

      const composerEn = impl.createUsePathComposer(() => "en")() as AnyPathComposer;
      const composerIt = impl.createUsePathComposer(() => "it")() as AnyPathComposer;

      expect(composerEn("/products/[id]", { id: "99" })).toBe("/products/99");
      expect(composerIt("/products/[id]", { id: "99" })).toBe("/prodotti/99");
    });

    it("composer reads locale from useLocale on each invocation", async () => {
      const { impl } = await createImpl({ atlas: aboutAtlas });

      let currentLocale = "en";
      const useLocale = () => currentLocale;
      const usePathComposer = impl.createUsePathComposer(useLocale);

      const composer1 = usePathComposer() as AnyPathComposer;
      expect(composer1("/about")).toBe("/about");

      currentLocale = "it";
      const composer2 = usePathComposer() as AnyPathComposer;
      expect(composer2("/about")).toBe("/chi-siamo");
    });

    it("composer handles root path", async () => {
      const { impl } = await createImpl();

      const composer = impl.createUsePathComposer(() => "en")();

      expect(composer("/")).toBe("/");
    });

    it("composer handles nested paths", async () => {
      const { impl } = await createImpl({ atlas: aboutWithTeamAtlas });

      const composerIt = impl.createUsePathComposer(() => "it")() as AnyPathComposer;

      expect(composerIt("/about/team")).toBe("/chi-siamo/staff");
    });

    it("composer handles catch-all paths with array params", async () => {
      const { impl } = await createImpl({ atlas: docsWithCatchAllAtlas });

      const composerEn = impl.createUsePathComposer(() => "en")() as AnyPathComposer;
      const composerIt = impl.createUsePathComposer(() => "it")() as AnyPathComposer;

      expect(composerEn("/docs/[...slug]", { slug: ["getting-started", "install"] })).toBe(
        "/docs/getting-started/install"
      );
      expect(composerIt("/docs/[...slug]", { slug: ["getting-started", "install"] })).toBe(
        "/documenti/getting-started/install"
      );
    });
  });

  // -----------------------------------------------------------------------
  // Translator delegation
  // -----------------------------------------------------------------------

  describe("translator delegation", () => {
    it("writeLocale delegates to pathTranslator for target path resolution", async () => {
      const atlas = aboutAtlas;
      const rMachine = createMockMachine();
      const strategyConfig = createMockStrategyConfig();
      const pathCanonicalizer = new HrefCanonicalizer(atlas, [...locales], defaultLocale);

      const pathTranslatorGet = vi.fn().mockReturnValue({ value: "/chi-siamo", dynamic: false });
      const pathTranslator = { get: pathTranslatorGet } as unknown as HrefTranslator;

      const impl = await createNextAppFlatClientImpl(rMachine, strategyConfig, pathTranslator, pathCanonicalizer);

      const router = createMockRouter();
      impl.writeLocale("en", "it", "/about", router as any);

      expect(pathTranslatorGet).toHaveBeenCalledWith("it", "/about");
      expect(router.push).toHaveBeenCalledWith("/chi-siamo");
    });

    it("path composer delegates to pathTranslator for path resolution", async () => {
      const atlas = aboutAtlas;
      const rMachine = createMockMachine();
      const strategyConfig = createMockStrategyConfig();
      const pathCanonicalizer = new HrefCanonicalizer(atlas, [...locales], defaultLocale);

      const pathTranslatorGet = vi.fn().mockReturnValue({ value: "/custom-path", dynamic: false });
      const pathTranslator = { get: pathTranslatorGet } as unknown as HrefTranslator;

      const impl = await createNextAppFlatClientImpl(rMachine, strategyConfig, pathTranslator, pathCanonicalizer);

      const composer = impl.createUsePathComposer(() => "it")() as AnyPathComposer;
      const result = composer("/about");

      expect(pathTranslatorGet).toHaveBeenCalledWith("it", "/about", undefined);
      expect(result).toBe("/custom-path");
    });

    it("writeLocale canonicalizes the current path before translating", async () => {
      const atlas = aboutAtlas;
      const rMachine = createMockMachine();
      const strategyConfig = createMockStrategyConfig();
      const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);

      const canonicalizerGet = vi.fn().mockReturnValue({ value: "/about", dynamic: false });
      const pathCanonicalizer = { get: canonicalizerGet } as unknown as HrefCanonicalizer;

      const impl = await createNextAppFlatClientImpl(rMachine, strategyConfig, pathTranslator, pathCanonicalizer);

      const router = createMockRouter();
      impl.writeLocale("it", "en", "/chi-siamo", router as any);

      expect(canonicalizerGet).toHaveBeenCalledWith("it", "/chi-siamo");
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe("edge cases", () => {
    it("writeLocale falls back to translated root for dynamic canonical paths", async () => {
      const rMachine = createMockMachine();
      const strategyConfig = createMockStrategyConfig();
      const pathTranslator = new HrefTranslator(productsAtlas, [...locales], defaultLocale);
      const pathCanonicalizer = new HrefCanonicalizer(productsAtlas, [...locales], defaultLocale);

      const pathTranslatorGetSpy = vi.spyOn(pathTranslator, "get");

      const impl = await createNextAppFlatClientImpl(rMachine, strategyConfig, pathTranslator, pathCanonicalizer);

      const router = createMockRouter();
      impl.writeLocale("en", "it", "/products/42", router as any);

      expect(pathTranslatorGetSpy).toHaveBeenCalledWith("it", "/");
    });

    it("writeLocale translates using the canonical path for static routes", async () => {
      const rMachine = createMockMachine();
      const strategyConfig = createMockStrategyConfig();
      const pathTranslator = new HrefTranslator(aboutAtlas, [...locales], defaultLocale);
      const pathCanonicalizer = new HrefCanonicalizer(aboutAtlas, [...locales], defaultLocale);

      const pathTranslatorGetSpy = vi.spyOn(pathTranslator, "get");

      const impl = await createNextAppFlatClientImpl(rMachine, strategyConfig, pathTranslator, pathCanonicalizer);

      const router = createMockRouter();
      impl.writeLocale("it", "en", "/chi-siamo", router as any);

      expect(pathTranslatorGetSpy).toHaveBeenCalledWith("en", "/about");
    });
  });
});
