import { RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";
import { createFormatters } from "./packages/r-machine/src/lib/fmt.js";

type ResourceAtlas = {
  ns1: { message: string };
  ns2: { message: string };
  ns3: { message: string };
};

const rMachineBuilder = RMachine.builder({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: async (namespace, locale) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      default: async ($) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { message: `${namespace}(${$.namespace}) in ${locale}(${$.locale})` };
      },
    };
  },
});
type Locale = RMachineLocale<typeof rMachineBuilder>;

class Formatters extends createFormatters((locale: Locale) => {
  return {
    uppercase: (str: string) => str.toUpperCase() + locale,
  };
}) {}

const rMachineExtBuilder = rMachineBuilder.with({ Formatters });
type R$ = RMachineRCtx<typeof rMachineExtBuilder>;

const rMachine = rMachineExtBuilder.create<ResourceAtlas>();

const r = await rMachine.pickR("en", "ns1");
console.log(r.message);

const [r1, r2] = await rMachine.pickRKit("it", "ns1", "ns2");
console.log(r1.message);
console.log(r2.message);
