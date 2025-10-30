import type { RMachineError } from "r-machine/errors";
import { type Bin, type BinFactoryMap, defaultBinFactory, type ImplPackage } from "r-machine/strategy";

type OnBindLocaleErrorBin<C> = Bin<
  C,
  {
    localeOption: string | undefined;
  },
  {}
>;
type WriteLocaleBin<C> = Bin<C, {}, {}>;

export type NextAppRouterServerImpl<C> = {
  readonly onBindLocaleError: (error: RMachineError, bin: OnBindLocaleErrorBin<C>) => void;
  readonly writeLocale: (newLocale: string, bin: WriteLocaleBin<C>) => void;
};

const binFactories: BinFactoryMap<NextAppRouterServerImpl<any>> = {
  onBindLocaleError: defaultBinFactory,
  writeLocale: defaultBinFactory,
};

export type NextAppRouterServerImplPackage<C> = ImplPackage<NextAppRouterServerImpl<C>>;

export function createNextAppRouterServerImplPackage<C>(
  impl: NextAppRouterServerImpl<C>
): NextAppRouterServerImplPackage<C> {
  return {
    impl,
    binFactories,
  };
}
