import type { RShape } from "r-machine";
import { type Locale, RPlug, shell } from "../../setup";

const currencyByLocale: Record<Locale, string> = {
  en: "USD",
  it: "EUR",
};

export const plug = RPlug.connect();

export const r = shell(() => {
  const {
    $: { locale },
    _,
  } = plug.use();

  const dateLongFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const dateShortFmt = new Intl.DateTimeFormat(locale, { dateStyle: "short" });
  const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: "medium" });
  const numberFmt = new Intl.NumberFormat(locale);
  const currencyFmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyByLocale[locale] ?? "USD",
  });
  const pluralRules = new Intl.PluralRules(locale);

  return _.surface({
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
  });
});

export type R_Shell_Lib_Fmt = RShape<typeof r>;
