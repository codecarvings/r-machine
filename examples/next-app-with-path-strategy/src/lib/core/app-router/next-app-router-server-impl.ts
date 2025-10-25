import type { RMachineError } from "r-machine/common";
import type { Bin, ImplPackage } from "r-machine/strategy";

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

export type NextAppRouterServerImplPackage<C> = ImplPackage<NextAppRouterServerImpl<C>>;
