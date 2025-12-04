"use client";

import FeatureBox from "@/components/server/feature-box";
import { useR } from "@/r-machine/client-toolset";

export default function Box3() {
  // Load the required localized resource
  const r = useR("features/box_3");

  return <FeatureBox feature={r} />;
}
