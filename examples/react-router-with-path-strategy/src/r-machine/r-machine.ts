import { RMachine } from "r-machine";

export const rMachine = new RMachine({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (namespace, locale) => import(/* @vite-ignore */ `./resources/${namespace}/${locale}`),
});
