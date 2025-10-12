import type { AnyAtlas, RMachine } from "r-machine";

interface ReadLocale$ {
  readonly rMachine: RMachine<AnyAtlas>;
}
type ReadLocale = ($: ReadLocale$) => string | undefined;

interface WriteLocale$ {
  readonly currentLocale: string;
  readonly rMachine: RMachine<AnyAtlas>;
}
type WriteLocale = (newLocale: string, $: WriteLocale$) => void;

export interface NextRMachineContextLocaleBridge {
  readonly readLocale: ReadLocale;
  readonly writeLocale: WriteLocale;
}
