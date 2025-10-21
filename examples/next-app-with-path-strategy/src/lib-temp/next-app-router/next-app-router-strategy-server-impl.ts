import type { AnyAtlas, RMachine, RMachineError } from "r-machine";

interface NextAppRouterStrategyServerImplFn$<SC> {
  readonly strategyConfig: SC;
  readonly rMachine: RMachine<AnyAtlas>;
}

interface OnBindLocaleError$<SC> extends NextAppRouterStrategyServerImplFn$<SC> {
  readonly localeOption: string | undefined;
}
type OnBindLocaleError<SC> = (error: RMachineError, $: OnBindLocaleError$<SC>) => void;

// Current locale not available since setLocale can be invoked even if bindLocale was not invoked
interface WriteLocale$<SC> extends NextAppRouterStrategyServerImplFn$<SC> {}
type WriteLocale<SC> = (newLocale: string, $: WriteLocale$<SC>) => void;

export interface NextAppRouterStrategyServerImpl<SC> {
  readonly onBindLocaleError: OnBindLocaleError<SC>;
  readonly writeLocale: WriteLocale<SC>;
}
