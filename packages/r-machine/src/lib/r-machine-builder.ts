import type { RMachine } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";
import type { AnyFmtProvider, FmtProviderCtor, OptionalFmtProvider } from "./fmt.js";
import type { AnyResourceAtlas } from "./r.js";

export interface RMachineBuilder<L extends AnyLocale> {
  with<FP extends OptionalFmtProvider = undefined>(extensions: RMachineExtensions<FP>): RMachineExtendedBuilder<L, FP>;
  create<RA extends AnyResourceAtlas>(): RMachine<RA, L, undefined>;
}

export interface RMachineExtensions<FP extends OptionalFmtProvider = undefined> {
  readonly Formatters?: FP extends AnyFmtProvider ? FmtProviderCtor<FP> : undefined;
}

/** Shallow clone — sufficient because extensions only hold constructor references. */
export function cloneRMachineExtensions<FP extends OptionalFmtProvider>(
  extensions: RMachineExtensions<FP>
): RMachineExtensions<FP> {
  return {
    ...extensions,
  };
}

declare const _fmtProviderTag: unique symbol;
export interface RMachineExtendedBuilder<L extends AnyLocale, FP extends OptionalFmtProvider> {
  readonly [_fmtProviderTag]?: FP;
  create<RA extends AnyResourceAtlas>(): RMachine<RA, L, FP>;
}
