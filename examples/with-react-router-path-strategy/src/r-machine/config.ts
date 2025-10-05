import type { RMachineConfigFactory } from "r-machine";

export const rMachineConfigFactory: RMachineConfigFactory = () => ({
  locales: ["en", "it"],
  defaultLocale: "en",
  rResolver: async (locale, namespace) => {
    const { default: r } = await import(/* @vite-ignore */ `./resources/${namespace}/${locale}`);
    return r;
  },
});
