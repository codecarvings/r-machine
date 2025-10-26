import type { useRouter } from "next/navigation";
import type { Bin, ImplPackage } from "r-machine/strategy";

type WriteLocaleBin<C> = Bin<
  C,
  {},
  {
    readonly router: ReturnType<typeof useRouter>;
  }
>;

export type NextClientImpl<C> = {
  readonly writeLocale: (newLocale: string, bin: WriteLocaleBin<C>) => void;
};

export type NextClientImplPackage<C> = ImplPackage<NextClientImpl<C>>;
