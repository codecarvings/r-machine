import { createConfig, RMachine, typeRef } from "r-machine";

type Atlas = {
  ns1: { message: string };
  ns2: { message: string };
  ns3: { message: string };
};

const config = createConfig(typeRef<Atlas>(), {
  locales: ["en", "it"],
  fallbackLocale: "en",
  rLoader: async (locale, namespace) => {
    return { message: `${namespace} in ${locale}` };
  },
  namespacesToPreload: ["ns1"],
});

const R_MACHINE = new RMachine(config);

const r = await R_MACHINE.pickR("en", "ns1");
console.log(r.message);

const [r1, r2] = await R_MACHINE.pickRKit("en", "ns1", "ns2");
console.log(r1.message);
console.log(r2.message);
