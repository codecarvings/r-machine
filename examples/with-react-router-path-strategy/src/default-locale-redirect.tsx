import { RMachine } from "r-machine";
import { Navigate } from "react-router";
import { rMachineConfigFactory } from "./r-machine/config";

export default function DefaultLocaleRedirect() {
  const defaultLocale = RMachine.get(rMachineConfigFactory).matchLocales(navigator.languages);
  return <Navigate to={`/${defaultLocale}`} replace />;
}
