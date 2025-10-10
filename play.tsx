import { RMachine } from "r-machine";
import { createReactRMachineContext } from "react-r-machine";
import type { R$ } from "./packages/r-machine/src/r-module.js";

type Atlas = {
  ns1: { message: string };
  ns2: { message: string };
  ns3: { message: string };
};

const rMachine = new RMachine<Atlas>({
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: async (locale, namespace) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      default: async ($: R$) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { message: `${namespace}(${$.namespace}) in ${locale}(${$.locale})` };
      },
    };
  },
});

const r = await rMachine.pickR("en", "ns1");
console.log(r.message);

const [r1, r2] = await rMachine.pickRKit("en", "ns1", "ns2");
console.log(r1.message);
console.log(r2.message);

export const { ReactRMachineProvider, useLocale, useR, useRKit } = createReactRMachineContext(() => rMachine, {
  getLocale: ($) => $.localeOption,
  setLocale: () => {
    throw new Error("Not implemented");
  },
});

const _helloWorld = <ReactRMachineProvider localeOption="en">Hello World</ReactRMachineProvider>;
