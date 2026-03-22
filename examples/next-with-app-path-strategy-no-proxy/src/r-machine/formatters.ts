import { createFormatters } from "r-machine";
import type { Locale } from "./r-machine";

const currencyByLocale: Record<Locale, string> = {
  en: "USD",
  "it-IT": "EUR",
};

// Place here any formatting functions that depend on the locale, such as date, time, number, or plural formatting.
// ---
// Declaring formatters as a named class gives a readable type name (Formatters)
// instead of the verbose generic type that createFormatters() would infer.
export class Formatters extends createFormatters((locale: Locale) => {
  const dateLongFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const dateShortFmt = new Intl.DateTimeFormat(locale, { dateStyle: "short" });
  const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: "medium" });
  const numberFmt = new Intl.NumberFormat(locale);
  const currencyFmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyByLocale[locale] ?? "USD",
  });
  const pluralRules = new Intl.PluralRules(locale);

  return {
    date: {
      long: (d: Date) => dateLongFmt.format(d),
      short: (d: Date) => dateShortFmt.format(d),
    },
    time: (d: Date) => timeFmt.format(d),
    number: (n: number) => numberFmt.format(n),
    currency: (n: number) => currencyFmt.format(n),
    plural: (count: number, one: string, other: string) => {
      const rule = pluralRules.select(count);
      return `${count} ${rule === "one" ? one : other}`;
    },

    // You can also add here any other locale-dependent values that you want to share across your resources
    appName: "🚀 R-Machine 😊",
  };
}) {}
