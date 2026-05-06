import { Plug, VertexFrame } from "@/r-machine/toolset";
import FeatureBox from "./FeatureBox";

export const plug = Plug("shell/features/box_3", "vertex/shopping-cart", "outer/profile");
export default function Box3() {
  const [box3, cart, profile] = plug.use();

  return (
    <FeatureBox badge={box3.badge} title={box3.title}>
      <VertexFrame gear={[cart, profile]}>{box3.description}</VertexFrame>
    </FeatureBox>
  );
}
