import type { AnyAtlas, RMachine } from "r-machine";

interface ReadLocale$ {
  readonly localeOption: string | undefined;
}
type ReadLocale = ($: ReadLocale$) => string | undefined;

interface WriteLocale$ {
  readonly currentLocale: string;
}
type WriteLocale = (newLocale: string, $: WriteLocale$) => void;

export interface NextAppRouterStrategyImpl {
  readonly readLocale: ReadLocale;
  readonly writeLocale: WriteLocale;
}

export type NextAppRouterStrategyImplFactory = (rMachine: RMachine<AnyAtlas>) => NextAppRouterStrategyImpl;
