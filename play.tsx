import { ofType, RMachine } from "r-machine";

type ResourceAtlas = {
  ns1: { message: string };
  ns2: { message: string };
  ns3: { message: string };
};

/*
class KitAtlas extends ResourceAtlas.select({
  abc: "ns1",
  def: "ns2",
}) {}
const kit = new KitAtlas();
*/

const { rMachine, R } = RMachine.create({
  resourceAtlas: ofType<ResourceAtlas>(),
  locales: ["en", "it"],
  defaultLocale: "en",
  rModuleResolver: async (namespace, locale) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      default: async ($: any) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { message: `${namespace}(${$.namespace}) in ${locale}(${$.locale})` };
      },
    };
  },
  kit: {
    prova: "ns1",
  },
});
// type Locale = RMachineLocale<typeof rMachine>;

const r = await rMachine.pickR("it", "ns1");
console.log(r.message);

const [r1, r2] = await rMachine.pickRKit("it", "ns1", "ns2");
console.log(r1.message);
console.log(r2.message);
