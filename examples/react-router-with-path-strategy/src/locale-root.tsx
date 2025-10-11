import { Outlet, useParams } from "react-router";
import { ReactRMachineProvider } from "./r-machine/context";

export default function LocaleRoot() {
  const { locale: localeOption } = useParams();

  const rMachineProviderProps = { localeOption };
  const { locale } = ReactRMachineProvider.probe(rMachineProviderProps);
  if (locale === undefined) {
    return <div>404 Not Found</div>;
  }

  return (
    <ReactRMachineProvider {...rMachineProviderProps}>
      <Outlet />
    </ReactRMachineProvider>
  );
}
