import { Plug } from "@/r-machine/toolset";

export const plug = Plug("outer/timer");
export function Exp() {
  const [timer] = plug.useR();
  console.log("Exp render", { timer: timer.value });
  return <div>Exp {timer.value}</div>;
}
