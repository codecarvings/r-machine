import type { AnyAtlas, RMachine } from "r-machine";

interface ReactStrategyImpl$<SC> {
  readonly strategyConfig: SC;
  readonly rMachine: RMachine<AnyAtlas>;
}

export interface ReactStrategyImpl$Ext {
  readonly writeLocale: object;
}

export type ReactStrategyImpl$ExtProvider<E extends ReactStrategyImpl$Ext> = {
  readonly [K in keyof E]: () => E[K];
};

type WriteLocale$<SC, E extends object> = ReactStrategyImpl$<SC> & {
  readonly currentLocale: string;
} & E;
type WriteLocale<SC, E extends object> = (newLocale: string, $: WriteLocale$<SC, E>) => void;

export interface ReactStrategyImpl<SC, E extends ReactStrategyImpl$Ext> {
  readonly writeLocale: WriteLocale<SC, E["writeLocale"]>;
}
