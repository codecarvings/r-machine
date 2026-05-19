import { Plug } from "@/r-machine/toolset";

export const plug = Plug("outer/timer");
export default function Exp() {
  const [timer, $] = plug.useR();
  return (
    <div>
      Exp {$.kit.fmt.currency(timer.value.value)} <br />[{timer.value.isOdd ? "odd" : "even"}] <br />
    </div>
  );
}
