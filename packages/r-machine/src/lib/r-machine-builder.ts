import type { RMachine } from "#r-machine";
import type { AnyLocale } from "#r-machine/locale";
import type { AnyFmtProvider, AnyFmtProviderCtor, EmptyFmtProvider, FmtProviderCtor } from "./fmt.js";
import { EmptyFmtProviderCtor } from "./fmt.js";
import type { AnyResourceAtlas } from "./r.js";

export interface RMachineExtensions<FP extends AnyFmtProvider> {
  readonly Formatters: FmtProviderCtor<FP>;
}

export interface PartialRMachineExtensions<FPC extends AnyFmtProviderCtor = FmtProviderCtor<EmptyFmtProvider>> {
  readonly Formatters?: FPC;
}

export const defaultRMachineExtensions: RMachineExtensions<EmptyFmtProvider> = {
  Formatters: EmptyFmtProviderCtor,
};

/** Shallow clone — sufficient because extensions only hold constructor references. */
export function cloneRMachineExtensions<E extends RMachineExtensions<any>>(extensions: E): E {
  return {
    ...extensions,
  };
}

export interface RMachineBuilder<L extends AnyLocale> {
  with<FPC extends AnyFmtProviderCtor = FmtProviderCtor<EmptyFmtProvider>>(
    extensions: PartialRMachineExtensions<FPC>
  ): RMachineExtendedBuilder<L, InstanceType<FPC>>;
  create<RA extends AnyResourceAtlas>(): RMachine<RA, L, EmptyFmtProvider>;
}

export interface RMachineExtendedBuilder<L extends AnyLocale, FP extends AnyFmtProvider> {
  create<RA extends AnyResourceAtlas>(): RMachine<RA, L, FP>;
}
