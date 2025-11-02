import { NextProxyPathStrategy } from "@r-machine/next/proxy";
import { RMachine } from "r-machine";
import type { Atlas } from "./atlas";

export const rMachine = new RMachine<Atlas>({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(`./resources/${namespace}/${locale}`),
});

export const strategy = new NextProxyPathStrategy({});
