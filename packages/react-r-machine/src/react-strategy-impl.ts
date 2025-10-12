interface ReadLocale$ {
  readonly localeOption: string | undefined;
}
type ReadLocale = ($: ReadLocale$) => string | undefined;

interface WriteLocale$ {
  readonly currentLocale: string;
}
type WriteLocale = (newLocale: string, $: WriteLocale$) => void;

export interface ReactStrategyImpl {
  readonly readLocale: ReadLocale;
  readonly writeLocale: WriteLocale;
}
