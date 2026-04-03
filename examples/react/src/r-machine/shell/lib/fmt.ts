import { type Locale, type R, RPlug } from "@/r-machine/setup";

const currencyByLocale: Record<Locale, string> = {
  en: "USD",
  it: "EUR",
};

export const plug = RPlug.connect();

export const r = plug.wireShell(() => {
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
  };
});

export type Shell_Lib_Fmt = R<typeof r>;
