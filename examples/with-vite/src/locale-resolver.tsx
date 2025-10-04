import { Outlet, useParams } from "react-router";
import { RMachineProvider } from "./r-machine/context";

export default function LocaleResolver() {
  let { locale } = useParams();
  if (!locale) {
    locale = "en";
  }

  return (
    <RMachineProvider locale={locale}>
      <Outlet />
    </RMachineProvider>
  );
}
