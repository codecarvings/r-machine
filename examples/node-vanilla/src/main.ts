import { rMachine } from "./r-machine/setup";

const [config, $] = await rMachine.WIP_GET(
  {
    fmt: "shell/lib/fmt",
  },
  ["base/config"],
  "en"
);
console.log(config);
console.log("----");
console.log($);
