import { notFound, redirect } from "next/navigation";
import { type BinFactoryMap, defaultBinFactory } from "r-machine/strategy";
import type { NextAppRouterCustomServerImpl } from "./next-app-router-custom-strategy.js";

export const serverImpl: NextAppRouterCustomServerImpl<any> = {
  onBindLocaleError() {
    notFound();
  },

  writeLocale(newLocale, bin) {
    const { basePath, lowercaseLocale } = bin.strategyConfig;
    const locale = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `${basePath}/${locale}`;

    redirect(path);
  },
};

export const serverBinFactories: BinFactoryMap<NextAppRouterCustomServerImpl<any>> = {
  onBindLocaleError: defaultBinFactory,
  writeLocale: defaultBinFactory,
};
