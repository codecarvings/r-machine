import { notFound, redirect } from "next/navigation";
import type { NextAppRouterCustomStrategyServerImpl } from "./next-app-router-custom-strategy";

export const serverImpl: NextAppRouterCustomStrategyServerImpl<string> = {
  onBindLocaleError() {
    notFound();
  },

  writeLocale(newLocale, $) {
    const { basePath, lowercaseLocale } = $.strategyConfig;
    const locale = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `${basePath}/${locale}`;

    redirect(path);
  },
};
