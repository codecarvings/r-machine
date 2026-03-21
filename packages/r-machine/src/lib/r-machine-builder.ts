import type { RMachine } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";
import type { AnyFmtProvider, AnyFmtProviderCtor, ExtractFmtProvider } from "./fmt.js";
import type { AnyResourceAtlas } from "./r.js";

export interface RMachineBuilder<L extends AnyLocale> {
  with<FPC extends AnyFmtProviderCtor = undefined>(
    extensions: RMachineExtensions<FPC>
  ): RMachineExtendedBuilder<L, ExtractFmtProvider<FPC>>;
  create<RA extends AnyResourceAtlas>(): RMachine<RA, L>;
}

export interface RMachineExtensions<C extends AnyFmtProviderCtor = undefined> {
  readonly Formatters?: C;
}

declare const _fmtProviderTag: unique symbol;
export interface RMachineExtendedBuilder<L extends AnyLocale, FP extends AnyFmtProvider> {
  readonly [_fmtProviderTag]?: FP;
  create<RA extends AnyResourceAtlas>(): RMachine<RA, L>;
}
