import type { ReactStrategyImpl } from "@r-machine/react";
import type { useRouter } from "next/navigation";

export interface NextAppRouterStrategyClientImplFn$Ext {
  readonly writeLocale: {
    readonly router: ReturnType<typeof useRouter>;
  };
}

export type NextAppRouterStrategyClientImpl<SC> = ReactStrategyImpl<SC, NextAppRouterStrategyClientImplFn$Ext>;
