"use client";

import { useLocale, useR, useSetLocale } from "@/r-machine/client-toolset";

export default function ClientComp1() {
  const r = useR("common");
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <>
      <h2>
        {r.title} ({locale})
      </h2>
      <div>
        <button type="button" onClick={async () => await setLocale("en")}>
          en (CLIENT)
        </button>
        <button type="button" onClick={async () => await setLocale("it")}>
          it (CLIENT)
        </button>
      </div>
    </>
  );
}
