import { RMachine } from "r-machine";
import { NextAppRouterStandardStrategy } from "@/lib/app-router/next-app-router-standard-strategy";
import type { Atlas } from "./atlas";

export const rMachine = new RMachine<Atlas>({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppRouterStandardStrategy();
