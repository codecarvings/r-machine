import { Plug } from "@/r-machine/toolset";

export const plug = Plug("outer/timer");
export function Exp() {
  console.log("Exp rendered");
  const [timer] = plug.useR();
  return <div>Exp {timer.value}</div>;
}
