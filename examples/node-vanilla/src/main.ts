import { rMachine } from "./r-machine/setup";

const gear = await rMachine.WIP_GET(["base/config"]);
console.log(gear);
