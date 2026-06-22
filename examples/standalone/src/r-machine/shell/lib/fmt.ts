import { type Locale, type RShape, Shell } from "../../setup.ts";

// A `shell(mono)`: one locale-aware instance, no per-locale variant files.
// Built on the platform's `Intl.*` (zero-bundle, locale-aware natively). Placed
// in `directKit` (setup.ts) so it surfaces as `$.kit.fmt` on every direct plug.
const currencyByLocale: Record<Locale, string> = {
  en: "USD",
  it: "EUR",
};

export const r = Shell.define((plugin) => {
  const locale = plugin.$.locale;

  const dateLongFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const numberFmt = new Intl.NumberFormat(locale);
  const currencyFmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyByLocale[locale] ?? "USD",
  });

  return {
    date: {
      long: (d: Date) => dateLongFmt.format(d),
    },
    number: (n: number) => numberFmt.format(n),
    currency: (n: number) => currencyFmt.format(n),
  };
});

export type Shell_Lib_Fmt = RShape<typeof r>;
