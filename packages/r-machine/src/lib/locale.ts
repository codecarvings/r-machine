export type AnyLocale = string;

export type AnyLocaleList = readonly AnyLocale[];

export type LocaleList<L extends AnyLocale> = readonly L[];
