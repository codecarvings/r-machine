import { Plug } from "@/r-machine/toolset";

export const plug = Plug("outer/timer");
export default function Exp() {
  const [timer, $] = plug.useR();
  console.log("Exp render", timer.value);
  return <div>Exp {$.kit.fmt.currency(timer.value)}</div>;
}
