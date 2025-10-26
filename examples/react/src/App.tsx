import { DelayedSuspense } from "@r-machine/react/utils";
import { useState } from "react";
import Body from "./Body";
import BodyLoading from "./components/BodyLoading";
import { rMachine } from "./r-machine/r-machine";
import { ReactRMachine } from "./r-machine/toolset";

export default function App() {
  const [locale, setLocale] = useState(() => {
    // Put your locale detection/initialization logic here
    return rMachine.localeHelper.matchLocales(navigator.languages);
  });

  return (
    <ReactRMachine locale={locale} writeLocale={setLocale}>
      <DelayedSuspense fallback={<BodyLoading />}>
        <Body />
      </DelayedSuspense>
    </ReactRMachine>
  );
}
