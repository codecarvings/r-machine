export const TEST_LOCALES = ["en", "it"] as const;
export const TEST_DEFAULT_LOCALE = "en";

export type TestLocale = (typeof TEST_LOCALES)[number];

export type SimplePathAtlas = { readonly decl: {} };

export type TranslatedPathAtlas = {
  readonly decl: {
    readonly "/about": { readonly it: "/chi-siamo" };
    readonly "/products": { readonly it: "/prodotti"; readonly "/[id]": {} };
  };
};
