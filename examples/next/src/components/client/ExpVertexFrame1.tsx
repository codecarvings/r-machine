"use client";

import { ClientPlug, VertexFrame } from "@/r-machine/client-toolset";
import { ExpVertex1 } from "./ExpVertex1";
import { ExpVertex2 } from "./ExpVertex2";

export const plug = ClientPlug({ timer1: "vertex/timer", timer2: "vertex/timer" });
export function ExpVertexFrame1() {
  const { timer1, timer2, $ } = plug.useR();

  return (
    <div>
      <VertexFrame gear={[timer2]}>
        <div className="mt-4">
          <h4>ExpVertexFrame1</h4> {$.kit.fmt.currency(timer1.value.value)} [{timer1.value.id}]<h4>ExpVertexFrame1</h4>{" "}
          {$.kit.fmt.currency(timer2.value.value)} [{timer2.value.id}]
        </div>
        <div className="mt-4">
          <ExpVertex1 title="ExpVertex1 inside ExpVertexFrame1 - A" />
        </div>
        <div className="mt-4">
          <ExpVertex2 title="ExpVertex2 inside ExpVertexFrame1 - B" />
        </div>
      </VertexFrame>
    </div>
  );
}
