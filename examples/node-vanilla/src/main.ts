import { common2 } from "./r-machine/resource-atlas";
import { rMachine } from "./r-machine/setup";

const [config, com2, $] = await rMachine.WIP_GET(
  {
    fmt: "shell/lib/fmt",
  },
  ["base/config", common2],
  "en"
);
console.log(config);
console.log("----");
console.log(com2);
console.log("----");
console.log($);
