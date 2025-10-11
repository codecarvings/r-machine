import type { AnyAtlas, RMachine } from "r-machine";

interface GetLocale$ {
  readonly localeOption: string | undefined;
  readonly rMachine: RMachine<AnyAtlas>;
}
type GetLocale = ($: GetLocale$) => string | undefined;

interface SetLocale$ extends GetLocale$ {
  readonly currentLocale: string;
}
type SetLocale = (newLocale: string, $: SetLocale$) => void;

export interface ReactRMachineLocaleContextBridge {
  readonly getLocale: GetLocale;
  readonly setLocale: SetLocale;
}
