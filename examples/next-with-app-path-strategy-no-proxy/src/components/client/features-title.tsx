"use client";

import { useR } from "@/r-machine/client-toolset";

export default function FeaturesTitle() {
  // Load the required localized resources
  const r = useR("landing-page");

  return (
    <>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{r.features.title}</h2>
      <p className="text-lg text-muted-foreground">{r.features.subtitle}</p>
    </>
  );
}
