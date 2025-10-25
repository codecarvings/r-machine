import { ReactDefaultStrategy, ReactToolset } from "@r-machine/react";
import { RMachine } from "r-machine";

type Atlas = {
  ns1: { message: string };
  ns2: { message: string };
  ns3: { message: string };
};

const rMachine = new RMachine<Atlas>({
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

const r = await rMachine.pickR("en", "ns1");
console.log(r.message);

const [r1, r2] = await rMachine.pickRKit("it", "ns1", "ns2");
console.log(r1.message);
console.log(r2.message);

const strategy = new ReactDefaultStrategy();
export const { ReactRMachine, useLocale, useR, useRKit } = ReactToolset.create(rMachine, strategy);

const _helloWorld = <ReactRMachine locale="it">Hello World</ReactRMachine>;
