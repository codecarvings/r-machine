import { rMachine } from "./r-machine/setup";

const gear = await rMachine.WIP_GET(["shell/common"]);
console.log(gear);
