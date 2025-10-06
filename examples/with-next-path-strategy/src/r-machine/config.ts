import type { RMachineConfigFactory } from "r-machine";

export const rMachineConfigFactory: RMachineConfigFactory = () => ({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: (locale, namespace) => import(/* @vite-ignore */ `./resources/${namespace}/${locale}`),
});
