import type { AnyAtlas, RMachine } from "r-machine";

interface WriteLocale$ {
  readonly rMachine: RMachine<AnyAtlas>;
  readonly currentLocale: string;
}
type WriteLocale = (newLocale: string, $: WriteLocale$) => void;

export interface ReactStrategyImpl {
  readonly writeLocale: WriteLocale;
}
