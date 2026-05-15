"use client";

import { ClientPlug } from "@/r-machine/client-toolset";

export const plug = ClientPlug("outer/timer");
export function Exp() {
  const [timer, $] = plug.useR();
  console.log("Exp render", timer.value);
  return <div>Exp 123 {$.kit.fmt.currency(timer.value)}</div>;
}
