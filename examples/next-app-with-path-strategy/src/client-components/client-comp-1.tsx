"use client";

import { useLocale, useR } from "@/r-machine/client-tools";

export default function ClientComp1() {
  const r = useR("common");
  const [locale, setLocale] = useLocale();

  return (
    <>
      <h2>
        {r.title} ({locale})
      </h2>
      <div>
        <button type="button" onClick={() => setLocale("en")}>
          en (CLIENT)
        </button>
        <button type="button" onClick={() => setLocale("it")}>
          it (CLIENT)
        </button>
      </div>
    </>
  );
}
