import { useR } from "@/r-machine/toolset";
import FeatureBox from "./FeatureBox";

export default function Box3() {
  // Load the required localized resource
  const r = useR("features/box_3");

  return <FeatureBox feature={r} />;
}
