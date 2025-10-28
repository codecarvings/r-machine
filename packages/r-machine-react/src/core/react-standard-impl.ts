import type { Bin, ImplPackage } from "r-machine/strategy";

type ReadLocaleBin<C> = Bin<C, {}, {}>;
type WriteLocaleBin<C> = Bin<C, {}, {}>;

export type ReactStandardImpl<C> = {
  readonly readLocale: (bin: ReadLocaleBin<C>) => string;
  readonly writeLocale: (newLocale: string, bin: WriteLocaleBin<C>) => void;
};

export type ReactStandardImplPackage<C> = ImplPackage<ReactStandardImpl<C>>;
