export const TEST_LOCALES = ["en", "it"] as const;
export const TEST_DEFAULT_LOCALE = "en";

export type TestLocale = (typeof TEST_LOCALES)[number];

// These type aliases intentionally mirror the classes in _helpers.ts but with
// deep readonly and string literal types, which is required for type-level tests.
// The _helpers.ts classes are used for runtime tests where readonly depth doesn't matter.
export type SimplePathAtlas = { readonly decl: {} };

export type TranslatedPathAtlas = {
  readonly decl: {
    readonly "/about": { readonly it: "/chi-siamo" };
    readonly "/products": { readonly it: "/prodotti"; readonly "/[id]": {} };
  };
};
