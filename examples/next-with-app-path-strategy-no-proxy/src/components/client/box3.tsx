"use client";

import FeatureBox from "@/components/server/feature-box";
import { ClientPlug } from "@/r-machine/client-toolset";

export const plug = ClientPlug("shell/features/box_3");
export default function Box3() {
  const [box] = plug.useR();

  return (
    <FeatureBox badge={box.badge} title={box.title}>
      {box.description}
    </FeatureBox>
  );
}
