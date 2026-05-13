import { getNamespaceList } from "r-machine/core";
import { common2 } from "./r-machine/resource-atlas";
import { rMachine } from "./r-machine/setup";

const locale = "en";
const result = (await rMachine.getGatePlugin(
  { fmt: "shell/lib/fmt" },
  getNamespaceList(["base/config", common2]),
  locale,
  ($) => {
    $.locale = locale;
  }
)) as [unknown, unknown, unknown];

const [config, com2, $] = result;
console.log(config);
console.log("----");
console.log(com2);
console.log("----");
console.log($);
