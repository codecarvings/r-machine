import type { AnyAtlas, RMachine, RMachineError } from "r-machine";

type OnBindLocale$ = {
  readonly rMachine: RMachine<AnyAtlas>;
  readonly locale: string | undefined;
  readonly error: RMachineError | undefined;
};
type OnBindLocale = ($: OnBindLocale$) => void;

interface WriteLocale$ {
  readonly rMachine: RMachine<AnyAtlas>;
  readonly currentLocale: string;
}
type WriteLocale = (newLocale: string, $: WriteLocale$) => void;

export interface NextAppRouterStrategyServerImpl {
  readonly onBindLocale: OnBindLocale;
  readonly writeLocale: WriteLocale;
}
