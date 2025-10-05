import { Navigate } from "react-router";
import { rMachine } from "./r-machine/r-machine";

export default function DefaultLocaleRedirect() {
  const defaultLocale = rMachine.matchLocales(navigator.languages);
  return <Navigate to={`/${defaultLocale}`} replace />;
}
