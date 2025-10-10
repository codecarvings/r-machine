import type { AnyAtlas } from "../r.js";
import type { RMachine } from "../r-machine.js";
import type { RMachineToken } from "../r-machine-resolver.js";

interface GetLocale$ {
  readonly localeOption: string | undefined;
  readonly token: RMachineToken;
  readonly rMachine: RMachine<AnyAtlas>;
}
type GetLocale = ($: GetLocale$) => string;

interface SetLocale$ extends GetLocale$ {
  readonly currentLocale: string;
}
type SetLocale = (newLocale: string, $: SetLocale$) => void;

export interface LocaleContextBridge {
  readonly getLocale: GetLocale;
  readonly setLocale: SetLocale;
}
