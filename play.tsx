import { RMachine, type RMachineConfig } from "r-machine";
import { createRMachineContext } from "react-r-machine";

type Atlas = {
  ns1: { message: string };
  ns2: { message: string };
  ns3: { message: string };
};

const config: RMachineConfig = {
  locales: ["en", "it"],
  fallbackLocale: "en",
  rLoader: async (locale, namespace) => {
    return { message: `${namespace} in ${locale}` };
  },
};

const rMachine = new RMachine<Atlas>(config);

const r = await rMachine.pickR("en", "ns1");
console.log(r.message);

const [r1, r2] = await rMachine.pickRKit("en", "ns1", "ns2");
console.log(r1.message);
console.log(r2.message);

export const { RMachineProvider, useR, useRKit } = createRMachineContext(rMachine);

const _helloWorld = <RMachineProvider locale="en">Hello World</RMachineProvider>;
