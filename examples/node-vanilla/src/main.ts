import { Gear } from "./r-machine/setup";

const r = Gear.deps("gear/config")
  .reactive("prova")
  .define(() => {
    return {};
  });
console.dir(r);

const value = await r.factory();
console.log(value);
