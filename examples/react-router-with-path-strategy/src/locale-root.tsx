import { Outlet, useParams } from "react-router";
import { ReactRMachine } from "./r-machine/toolset";

export default function LocaleRoot() {
  const { locale: localeOption } = useParams();
  const locale = ReactRMachine.probe(localeOption);
  if (locale === undefined) {
    return <div>404 Not Found</div>;
  }

  return (
    <ReactRMachine locale={locale}>
      <Outlet />
    </ReactRMachine>
  );
}
