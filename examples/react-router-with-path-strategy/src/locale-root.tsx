import { Outlet, useParams } from "react-router";
import { ReactRMachine } from "./r-machine/tools";

export default function LocaleRoot() {
  const { locale: localeOption } = useParams();

  const rMachineProps = { localeOption };
  const { locale } = ReactRMachine.probe(rMachineProps);
  if (locale === undefined) {
    return <div>404 Not Found</div>;
  }

  return (
    <ReactRMachine {...rMachineProps}>
      <Outlet />
    </ReactRMachine>
  );
}
