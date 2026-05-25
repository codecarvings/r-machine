"use client";

import { ClientPlug } from "@/r-machine/client-toolset";

export const plug = ClientPlug("vertex/timer");
export function Exp2({ title }: { title: string }) {
  console.log("Exp2 rendered", title);
  const [timer, $] = plug.useR();
  return (
    <div>
      <h4>{title}</h4> {$.kit.fmt.currency(timer.value.value)}
    </div>
  );
}
