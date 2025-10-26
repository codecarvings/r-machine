"use client";

import { useRouter } from "next/navigation";
import type { BinProviderMap } from "r-machine/strategy";
import type { NextAppRouterCustomClientImpl } from "./next-app-router-custom-strategy.js";

export const clientImpl: NextAppRouterCustomClientImpl<any> = {
  writeLocale(newLocale, bin) {
    const { basePath, lowercaseLocale } = bin.strategyConfig;
    const locale = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `${basePath}/${locale}`;

    bin.router.push(path);
  },
};

export const clientBinProviders: BinProviderMap<NextAppRouterCustomClientImpl<any>> = {
  writeLocale: (partialBin) => {
    const router = useRouter();
    return {
      ...partialBin,
      router,
    };
  },
};
