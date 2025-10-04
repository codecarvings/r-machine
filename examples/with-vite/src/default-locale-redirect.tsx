import { Navigate } from "react-router";

export default function DefaultLocaleRedirect() {
  const locale = "en";
  return (
    <Navigate to={`/${locale}`} replace />
  );
}
