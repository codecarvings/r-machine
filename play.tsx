import { RMachine } from "r-machine";
import { ResourceAtlasSeed } from "./packages/r-machine/src/lib/resource-atlas-seed.js";

class ResourceAtlas extends ResourceAtlasSeed.create<{
  ns1: { message: string };
  ns2: { message: string };
  ns3: { message: string };
}>() {}

const rMachine = RMachine.create({
  ResourceAtlas,
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
// type Locale = RMachineLocale<typeof rMachine>;

const r = await rMachine.pickR("it", "ns1");
console.log(r.message);

const [r1, r2] = await rMachine.pickRKit("it", "ns1", "ns2");
console.log(r1.message);
console.log(r2.message);
