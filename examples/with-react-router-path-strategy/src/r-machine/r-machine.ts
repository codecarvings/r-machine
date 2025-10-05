import { RMachine, type RMachineConfigFactory } from "r-machine";
import type { Atlas } from "./atlas";

const rMachineConfigFactory: RMachineConfigFactory = () => ({
  locales: ["en", "it"],
  defaultLocale: "en",
  rResolver: async (locale, namespace) => {
    const { default: r } = await import(/* @vite-ignore */ `./resources/${namespace}/${locale}`);
    return r;
  },
});

export const rMachine = RMachine.get<Atlas>(rMachineConfigFactory);
