import { Shell } from "./setup.js";

/**
 * Locale-aware shell: its content is decided by `$.locale`. Lets the locale
 * suite assert that `mockPlug(...).with({ $: { locale } })` re-resolves the
 * shell in the requested locale (§14.3/14.4).
 */
export const r = Shell.define((plugin) => {
  const locale = plugin.$.locale;
  return { greeting: locale === "it" ? "Ciao" : "Hello" };
});
