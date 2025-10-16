import type { AnyAtlas, RMachine } from "r-machine";

interface ReactStrategyImplFn$<SC> {
  readonly strategyConfig: SC;
  readonly rMachine: RMachine<AnyAtlas>;
}

interface WriteLocale$<SC> extends ReactStrategyImplFn$<SC> {
  readonly currentLocale: string;
}
type WriteLocale<SC> = (newLocale: string, $: WriteLocale$<SC>) => void;

export interface ReactStrategyImpl<SC> {
  readonly writeLocale: WriteLocale<SC>;
}
