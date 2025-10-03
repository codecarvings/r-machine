import { RMachine } from "r-machine";
import type { Atlas } from "./atlas";

export const rMachine = new RMachine<Atlas>({
  locales: ["en", "it"],

  rLoader: async (locale, namespace) => {
    const { default: r } = await import(/* @vite-ignore */ `./resources/${namespace}/${locale}`);
    return r;
  },
});
