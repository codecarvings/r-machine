import type { useRouter } from "next/navigation";
import { RMachineError } from "r-machine";
import type { NextAppRouterCustomStrategyClientImpl } from "./next-app-router-custom-strategy";

export const clientImpl: NextAppRouterCustomStrategyClientImpl<string> = {
  writeLocale(newLocale, $) {
    const { basePath, lowercaseLocale } = $.strategyConfig;
    const locale = lowercaseLocale ? newLocale.toLowerCase() : newLocale;
    const path = `${basePath}/${locale}`;

    // Workaround to make the Next.js router available in the client implementation
    const router = (global as any).__R_MACHINE_NEXT_ROUTER as ReturnType<typeof useRouter> | undefined;

    if (router) {
      router.push(path);
    } else if (typeof document !== "undefined") {
      document.location.pathname = path;
    } else {
      const error = new RMachineError("writeLocale error: Next.js router is not available");
      console.error(error);
      throw error;
    }
  },
};
