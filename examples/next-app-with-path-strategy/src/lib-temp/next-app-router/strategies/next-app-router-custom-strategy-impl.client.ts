import type { NextAppRouterCustomStrategyClientImpl } from "./next-app-router-custom-strategy";

export const clientImpl: NextAppRouterCustomStrategyClientImpl<string> = {
  writeLocale(newLocale, $) {
    const { basePath, lowercaseLocale } = $.strategyConfig;
    const locale = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `${basePath}/${locale}`;

    $.router.push(path);
  },
};
