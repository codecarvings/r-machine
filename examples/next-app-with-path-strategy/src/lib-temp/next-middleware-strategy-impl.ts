import type { AnyAtlas, RMachine } from "r-machine";

type PreReadLocale$ = {
  readonly rMachine: RMachine<AnyAtlas>;
};
type PreReadLocale = ($: PreReadLocale$) => string | undefined;

type ReadLocale$ = {
  readonly rMachine: RMachine<AnyAtlas>;
};
type ReadLocale = ($: ReadLocale$) => string | undefined;

interface WriteLocale$ {
  readonly rMachine: RMachine<AnyAtlas>;
  readonly currentLocale: string;
}
type WriteLocale = (newLocale: string, $: WriteLocale$) => void;

export interface NextMiddlewareStrategyImpl {
  readonly preReadLocale: PreReadLocale;
  readonly readLocale: ReadLocale;
  readonly writeLocale: WriteLocale;
}
