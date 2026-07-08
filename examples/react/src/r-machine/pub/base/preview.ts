import { BaseGear, type RShape, res } from "@/r-machine/setup";

// A locale-AGNOSTIC gear that reuses locale-keyed content across locales.
//
// `res.perLocale("shell/showcase")` injects a locale LOADER
// `(locale) => Promise<Surface>` instead of a plain surface. `pickAll` then
// resolves it for EVERY configured locale in a single call (locale-major), so a
// consumer can render all translations at once — independent of the app's
// active locale.
export const r = BaseGear.withDeps({ showcase: res.perLocale("shell/showcase") }).define(async (plugin) => {
  const { showcase } = plugin;
  return { preview: await res.perLocale.pickAll(showcase) };
});

export type Base_Preview = RShape<typeof r>;
