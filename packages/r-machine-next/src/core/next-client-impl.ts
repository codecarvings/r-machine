"use client";

import { useRouter } from "next/navigation";
import type { Bin, BinFactoryMap, ImplPackage } from "r-machine/strategy";

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

const binFactories: BinFactoryMap<NextClientImpl<any>> = {
  writeLocale: (partialBin) => {
    const router = useRouter();
    return {
      ...partialBin,
      router,
    };
  },
};

export type NextClientImplPackage<C> = ImplPackage<NextClientImpl<C>>;

export function createNextClientImplPackage<C>(impl: NextClientImpl<C>): NextClientImplPackage<C> {
  return {
    impl,
    binFactories,
  };
}
