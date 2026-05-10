"use client";

import { ClientPlug } from "@/r-machine/client-toolset";

export const plug = ClientPlug("shell/landing-page");
export default function FeaturesTitle() {
  const [page] = plug.useR();

  return (
    <>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{page.features.title}</h2>
      <p className="text-lg text-muted-foreground">{page.features.subtitle}</p>
    </>
  );
}
