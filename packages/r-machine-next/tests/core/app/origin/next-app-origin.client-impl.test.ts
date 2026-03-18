import { afterEach, describe, expect, it, vi } from "vitest";
import { HrefCanonicalizer, HrefTranslator } from "#r-machine/next/core";
import { createNextAppOriginClientImpl } from "../../../../src/core/app/origin/next-app-origin.client-impl.js";
import type { AnyNextAppOriginStrategyConfig } from "../../../../src/core/app/origin/next-app-origin-strategy-core.js";
import {
  aboutAtlas,
  aboutWithTeamAtlas,
  createMockAtlas,
  docsWithCatchAllAtlas,
  productsAtlas,
} from "../../../_fixtures/_helpers.js";
import type { TestLocale } from "../../../_fixtures/constants.js";
import { TEST_DEFAULT_LOCALE as defaultLocale, TEST_LOCALES as locales } from "../../../_fixtures/constants.js";
import { createMockMachine } from "../../../_fixtures/mock-machine.js";
import { createMockRouter } from "../../../_fixtures/mock-router.js";
import type { AnyPathComposer } from "../../../_fixtures/test-types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
}

async function createImpl(options: CreateImplOptions = {}) {
  const atlas = options.atlas ?? createMockAtlas();
  const localeOriginMap = options.localeOriginMap ?? {
    en: "https://en.example.com",
    it: "https://it.example.com",
  };

  const rMachine = createMockMachine();
  const strategyConfig = createMockStrategyConfig({ localeOriginMap });
  const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
  const urlTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
  const pathCanonicalizer = new HrefCanonicalizer(atlas, [...locales], defaultLocale);

  const impl = await createNextAppOriginClientImpl(
    rMachine,
    strategyConfig,
    pathTranslator,
    urlTranslator,
    pathCanonicalizer
  );

  return { impl, rMachine, strategyConfig, pathTranslator, urlTranslator, pathCanonicalizer };
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

describe("createNextAppOriginClientImpl", () => {
  it("returns an object conforming to NextAppClientImpl", async () => {
    const { impl } = await createImpl();

    expect(impl).toBeDefined();
    expect(typeof impl.writeLocale).toBe("function");
    expect(typeof impl.createUsePathComposer).toBe("function");
  });

  // -----------------------------------------------------------------------
  // onLoad
  // -----------------------------------------------------------------------

  describe("onLoad", () => {
    it("is undefined", async () => {
      const { impl } = await createImpl();

      expect(impl.onLoad).toBeUndefined();
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

      expect(router.push).not.toHaveBeenCalled();
    });

    describe("with static paths", () => {
      it("navigates to the url-translated path for root", async () => {
        const { impl } = await createImpl();
        const router = createMockRouter();

        impl.writeLocale("en", "it", "/", router as any);

        expect(router.push).toHaveBeenCalledOnce();
        expect(router.push).toHaveBeenCalledWith("/");
      });

      it("navigates to the url-translated path for a declared path", async () => {
        const { impl } = await createImpl({ atlas: aboutAtlas });
        const router = createMockRouter();

        impl.writeLocale("en", "it", "/about", router as any);

        expect(router.push).toHaveBeenCalledOnce();
        expect(router.push).toHaveBeenCalledWith("/chi-siamo");
      });

      it("navigates to the url-translated path when switching from a translated path", async () => {
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
    });

    describe("with dynamic paths", () => {
      it("redirects to root when path is dynamic", async () => {
        const { impl } = await createImpl({ atlas: productsAtlas });
        const router = createMockRouter();

        impl.writeLocale("en", "it", "/products/42", router as any);

        expect(router.push).toHaveBeenCalledOnce();
        expect(router.push).toHaveBeenCalledWith("/");
      });

      it("redirects to translated root for the target locale", async () => {
        const { impl } = await createImpl({ atlas: productsAtlas });
        const router = createMockRouter();

        impl.writeLocale("it", "en", "/prodotti/42", router as any);

        expect(router.push).toHaveBeenCalledOnce();
        expect(router.push).toHaveBeenCalledWith("/");
      });
    });

    describe("with undeclared paths", () => {
      it("treats undeclared paths as static and passes them through", async () => {
        const { impl } = await createImpl();
        const router = createMockRouter();

        impl.writeLocale("en", "it", "/unknown-page", router as any);

        expect(router.push).toHaveBeenCalledOnce();
        expect(router.push).toHaveBeenCalledWith("/unknown-page");
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

      const usePathComposer = impl.createUsePathComposer(() => "en");
      const composer = usePathComposer();

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
      const useLocale = () => currentLocale as TestLocale;
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
  // Integration: urlTranslator vs pathTranslator separation
  // -----------------------------------------------------------------------

  describe("translator delegation", () => {
    it("writeLocale uses urlTranslator (4th arg) for navigation", async () => {
      const atlas = aboutAtlas;
      const rMachine = createMockMachine();
      const strategyConfig = createMockStrategyConfig();
      const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
      const pathCanonicalizer = new HrefCanonicalizer(atlas, [...locales], defaultLocale);

      const urlTranslatorGet = vi.fn().mockReturnValue({ value: "https://it.example.com/chi-siamo", dynamic: false });
      const urlTranslator = { get: urlTranslatorGet } as unknown as HrefTranslator;

      const impl = await createNextAppOriginClientImpl(
        rMachine,
        strategyConfig,
        pathTranslator,
        urlTranslator,
        pathCanonicalizer
      );

      const router = createMockRouter();
      impl.writeLocale("en", "it", "/about", router as any);

      expect(urlTranslatorGet).toHaveBeenCalled();
      expect(router.push).toHaveBeenCalledWith("https://it.example.com/chi-siamo");
    });

    it("createUsePathComposer uses pathTranslator (3rd arg) for composition", async () => {
      const atlas = aboutAtlas;
      const rMachine = createMockMachine();
      const strategyConfig = createMockStrategyConfig();
      const pathCanonicalizer = new HrefCanonicalizer(atlas, [...locales], defaultLocale);
      const urlTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);

      const pathTranslatorGet = vi.fn().mockReturnValue({ value: "/custom-path", dynamic: false });
      const pathTranslator = { get: pathTranslatorGet } as unknown as HrefTranslator;

      const impl = await createNextAppOriginClientImpl(
        rMachine,
        strategyConfig,
        pathTranslator,
        urlTranslator,
        pathCanonicalizer
      );

      const composer = impl.createUsePathComposer(() => "it")() as AnyPathComposer;
      const result = composer("/about");

      expect(pathTranslatorGet).toHaveBeenCalledWith("it", "/about", undefined);
      expect(result).toBe("/custom-path");
    });

    it("writeLocale uses pathCanonicalizer (5th arg) to canonicalize before translating", async () => {
      const atlas = aboutAtlas;
      const rMachine = createMockMachine();
      const strategyConfig = createMockStrategyConfig();
      const pathTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);
      const urlTranslator = new HrefTranslator(atlas, [...locales], defaultLocale);

      const canonicalizerGet = vi.fn().mockReturnValue({ value: "/about", dynamic: false });
      const pathCanonicalizer = { get: canonicalizerGet } as unknown as HrefCanonicalizer;

      const impl = await createNextAppOriginClientImpl(
        rMachine,
        strategyConfig,
        pathTranslator,
        urlTranslator,
        pathCanonicalizer
      );

      const router = createMockRouter();
      impl.writeLocale("it", "en", "/chi-siamo", router as any);

      expect(canonicalizerGet).toHaveBeenCalledWith("it", "/chi-siamo");
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe("edge cases", () => {
    it("writeLocale with dynamic canonical path redirects to urlTranslator root", async () => {
      const rMachine = createMockMachine();
      const strategyConfig = createMockStrategyConfig();
      const pathTranslator = new HrefTranslator(productsAtlas, [...locales], defaultLocale);
      const urlTranslator = new HrefTranslator(productsAtlas, [...locales], defaultLocale);
      const pathCanonicalizer = new HrefCanonicalizer(productsAtlas, [...locales], defaultLocale);

      const urlTranslatorGetSpy = vi.spyOn(urlTranslator, "get");

      const impl = await createNextAppOriginClientImpl(
        rMachine,
        strategyConfig,
        pathTranslator,
        urlTranslator,
        pathCanonicalizer
      );

      const router = createMockRouter();
      impl.writeLocale("en", "it", "/products/42", router as any);

      expect(urlTranslatorGetSpy).toHaveBeenCalledWith("it", "/");
    });

    it("writeLocale with static canonical path passes canonical value to urlTranslator", async () => {
      const rMachine = createMockMachine();
      const strategyConfig = createMockStrategyConfig();
      const pathTranslator = new HrefTranslator(aboutAtlas, [...locales], defaultLocale);
      const urlTranslator = new HrefTranslator(aboutAtlas, [...locales], defaultLocale);
      const pathCanonicalizer = new HrefCanonicalizer(aboutAtlas, [...locales], defaultLocale);

      const urlTranslatorGetSpy = vi.spyOn(urlTranslator, "get");

      const impl = await createNextAppOriginClientImpl(
        rMachine,
        strategyConfig,
        pathTranslator,
        urlTranslator,
        pathCanonicalizer
      );

      const router = createMockRouter();
      impl.writeLocale("it", "en", "/chi-siamo", router as any);

      expect(urlTranslatorGetSpy).toHaveBeenCalledWith("en", "/about");
    });
  });
});
