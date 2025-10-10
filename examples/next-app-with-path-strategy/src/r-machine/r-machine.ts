import { RMachine } from "r-machine";
import type { Atlas } from "./atlas";

export const rMachine = new RMachine<Atlas>({
  locales: ["en", "en-US", "it"],
  defaultLocale: "en",
  rModuleResolver: (locale, namespace) => import(`./resources/${namespace}/${locale}`),
});
