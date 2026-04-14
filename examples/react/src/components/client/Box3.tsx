import { VertexFrame } from "@r-machine/react";
import { Plug } from "@/r-machine/toolset";
import FeatureBox from "./FeatureBox";

export const plug = Plug("shell/features/box_3", "gear/shopping-cart");
export default function Box3() {
  const [box3, cart] = plug.use();

  return (
    <FeatureBox badge={box3.badge} title={box3.title}>
      <VertexFrame gear={cart}>{box3.description}</VertexFrame>
    </FeatureBox>
  );
}
