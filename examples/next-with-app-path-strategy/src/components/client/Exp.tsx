"use client";

import { ClientPlug } from "@/r-machine/client-toolset";

export const plug = ClientPlug("outer/timer");
export function Exp() {
  const [timer, $] = plug.useR();
  return <div>Exp {$.kit.fmt.currency(timer.value)}</div>;
}
