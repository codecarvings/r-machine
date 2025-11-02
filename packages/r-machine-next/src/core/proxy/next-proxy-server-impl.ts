import type { NextRequest } from "next/server";
import { type Bin, type BinFactoryMap, defaultBinFactory, type ImplPackage } from "r-machine/strategy";

type ReadLocaleBin<C> = Bin<
  C,
  {
    readonly request: NextRequest;
  },
  {}
>;
type WriteLocaleBin<C> = Bin<C, {}, {}>;

export type NextProxyServerImpl<C> = {
  readonly readLocale: (bin: ReadLocaleBin<C>) => string;
  readonly writeLocale: (newLocale: string, bin: WriteLocaleBin<C>) => void;
};

const binFactories: BinFactoryMap<NextProxyServerImpl<any>> = {
  readLocale: defaultBinFactory,
  writeLocale: defaultBinFactory,
};

export type NextProxyServerImplPackage<C> = ImplPackage<NextProxyServerImpl<C>>;

export function createNextProxyServerImplPackage<C>(impl: NextProxyServerImpl<C>): NextProxyServerImplPackage<C> {
  return {
    impl,
    binFactories,
  };
}
