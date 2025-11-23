"use client";

import { useR } from "@/r-machine/client-toolset";
import FeatureBox from "../server/feature-box";

export default function Box3() {
  // Load the required localized resource
  const r = useR("features/box_3");

  return <FeatureBox feature={r} />;
}
