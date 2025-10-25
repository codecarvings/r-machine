import type { Bin, ImplPackage } from "r-machine/strategy";

type WriteLocaleBin<C> = Bin<C, {}, {}>;

export type ReactImpl<C> = {
  readonly writeLocale: (newLocale: string, bin: WriteLocaleBin<C>) => void;
};

export type ReactImplPackage<C> = ImplPackage<ReactImpl<C>>;
