import { RMachineProvider } from "react-r-machine";
import { Outlet, useParams } from "react-router";
import { rMachineConfigFactory } from "./r-machine/config";

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
