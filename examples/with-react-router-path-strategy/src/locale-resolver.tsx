import { Outlet, useParams } from "react-router";
import { rMachineConfigFactory } from "./r-machine/config";
import { RMachineProvider } from "./r-machine/react-context";

export default function LocaleResolver() {
  let { locale } = useParams();
  if (!locale) {
    locale = "en";
  }

  return (
    <RMachineProvider configFactory={rMachineConfigFactory} locale={locale}>
      <Outlet />
    </RMachineProvider>
  );
}
