import type { useRouter } from "next/navigation";
import type { ReactStrategyImpl } from "react-r-machine";

export interface NextAppRouterStrategyClientImplFn$Ext {
  readonly writeLocale: {
    readonly router: ReturnType<typeof useRouter>;
  };
}

export type NextAppRouterStrategyClientImpl<SC> = ReactStrategyImpl<SC, NextAppRouterStrategyClientImplFn$Ext>;
