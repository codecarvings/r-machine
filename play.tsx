import { RMachine, type RMachineConfigFactory } from "r-machine";
import { createReactRMachineHooks, RMachineProvider } from "react-r-machine";

type Atlas = {
  ns1: { message: string };
  ns2: { message: string };
  ns3: { message: string };
};

const configFactory: RMachineConfigFactory = () => ({
  locales: ["en", "it"],
  defaultLocale: "en",
  rResolver: async (locale, namespace) => {
    return { message: `${namespace} in ${locale}` };
  },
});

const rMachine = RMachine.get<Atlas>(configFactory);

const r = await rMachine.pickR("en", "ns1");
console.log(r.message);

rMachine.mapLocale;

const [r1, r2] = await rMachine.pickRKit("en", "ns1", "ns2");
console.log(r1.message);
console.log(r2.message);

export const { useR, useRKit } = createReactRMachineHooks<Atlas>();

const _helloWorld = (
  <RMachineProvider configFactory={configFactory} locale="en">
    Hello World
  </RMachineProvider>
);
