import { RMachine } from "r-machine";
import { NextAppRouterDefaultStrategy } from "@/lib-temp/next-app-router-strategies";
import type { Atlas } from "./atlas";

export const rMachine = new RMachine<Atlas>({
  locales: ["en", "en-US", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextAppRouterDefaultStrategy();
