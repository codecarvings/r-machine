import { FormattersSeed, RMachine, type RMachineLocale, type RMachineRCtx } from "r-machine";

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

class Formatters extends FormattersSeed.create((locale: Locale) => {
  return {
    uppercase: (str: string) => str.toUpperCase() + locale,
  };
}) {}

const rMachineExtBuilder = rMachineBuilder.with({ Formatters });
export type R$ = RMachineRCtx<typeof rMachineExtBuilder>;

const rMachine = rMachineExtBuilder.create<ResourceAtlas>();
export const { uppercase } = rMachine.fmt("en");

const r = await rMachine.pickR("en", "ns1");
console.log(r.message);

const [r1, r2] = await rMachine.pickRKit("it", "ns1", "ns2");
console.log(r1.message);
console.log(r2.message);
