import { Plug } from "@/r-machine/toolset";
import FeatureBox from "./FeatureBox";

export const plug = Plug("shell/features/box_3");
export default function Box3() {
  const [box3] = plug.useR();

  return (
    <FeatureBox badge={box3.badge} title={box3.title}>
      {box3.description}
    </FeatureBox>
  );
}
