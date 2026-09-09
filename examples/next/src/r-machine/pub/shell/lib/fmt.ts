import { type Locale, type RShape, Shell } from "@/r-machine/setup";

const currencyByLocale: Record<Locale, string> = {
  en: "USD",
  it: "EUR",
};

export const r = Shell.define((plugin) => {
  const locale = plugin.$.locale;

  const dateLongFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const dateShortFmt = new Intl.DateTimeFormat(locale, { dateStyle: "short" });
  const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: "medium" });
  const numberFmt = new Intl.NumberFormat(locale, { useGrouping: "always" }); // useGrouping: "always" to prevent CLDR mismatch
  const currencyFmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyByLocale[locale] ?? "USD",
    useGrouping: "always", // useGrouping: "always" to prevent CLDR mismatch
  });
  const pluralRules = new Intl.PluralRules(locale);
  const collator = new Intl.Collator(locale);

  return {
    date: {
      long: (d: Date) => dateLongFmt.format(d),
      short: (d: Date) => dateShortFmt.format(d),
    },
    time: (d: Date) => timeFmt.format(d),
    number: (n: number) => numberFmt.format(n),
    currency: (n: number) => currencyFmt.format(n),
    /**
     * Locale-aware string collation. `String.prototype.localeCompare()` with no
     * argument sorts by the *runtime's* default locale, not the active one — so
     * alphabetical ordering silently ignores `$.locale`. Sorting is the one part
     * of a list view that really is a locale-dependent resource; this is where
     * it lives.
     */
    compare: (a: string, b: string) => collator.compare(a, b),
    plural: (count: number, one: string, other: string) => {
      const rule = pluralRules.select(count);
      return `${count} ${rule === "one" ? one : other}`;
    },
  };
});

export type Shell_Lib_Fmt = RShape<typeof r>;
