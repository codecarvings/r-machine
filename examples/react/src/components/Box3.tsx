import { useR } from "@/r-machine/toolset";
import FeatureBox from "./FeatureBox";

export default function Box1() {
  const r = useR("features/box_3"); // Fetch R-Machine content
  return <FeatureBox feature={r} />;
}
