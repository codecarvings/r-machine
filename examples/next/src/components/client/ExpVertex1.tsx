"use client";

import { ClientPlug } from "@/r-machine/client-toolset";

export const plug = ClientPlug("vertex/timer");
export function ExpVertex1({ title }: { title: string }) {
  const [timer, $] = plug.useR();

  return (
    <div>
      <h4>{title}</h4> {$.kit.fmt.currency(timer.value.value)} [{timer.value.id}]
    </div>
  );
}
