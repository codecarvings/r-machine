import { type Bin, type BinFactoryMap, defaultBinFactory, type ImplPackage } from "r-machine/strategy";

type ReadLocaleBin<C> = Bin<C, {}, {}>;
type WriteLocaleBin<C> = Bin<C, {}, {}>;

export type ReactStandardImpl<C> = {
  readonly readLocale: (bin: ReadLocaleBin<C>) => string;
  readonly writeLocale: (newLocale: string, bin: WriteLocaleBin<C>) => void;
};

const binFactories: BinFactoryMap<ReactStandardImpl<any>> = {
  readLocale: defaultBinFactory,
  writeLocale: defaultBinFactory,
};

export type ReactStandardImplPackage<C> = ImplPackage<ReactStandardImpl<C>>;

export function createReactStandardImplPackage<C>(impl: ReactStandardImpl<C>): ReactStandardImplPackage<C> {
  return {
    impl,
    binFactories,
  };
}
