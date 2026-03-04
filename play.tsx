import { RMachine } from "r-machine";

type ResourceAtlas = {
  ns1: { message: string };
  ns2: { message: string };
  ns3: { message: string };
};

const rMachine = new RMachine<ResourceAtlas>({
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
