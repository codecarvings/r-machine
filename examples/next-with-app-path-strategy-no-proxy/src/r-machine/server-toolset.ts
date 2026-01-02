import { strategy } from "./r-machine";

export const {
  NextServerRMachine,
  rMachineProxy,
  generateLocaleStaticParams,
  bindLocale,
  getLocale,
  setLocale,
  pickR,
  pickRKit,
  getPathComposer,
} = await strategy.getServerToolset();
