import { redirect } from "next/navigation";
import { rMachine } from "@/r-machine/r-machine";

export default function Page() {
  const defaultLocale = rMachine.localeHelper.matchLocales(navigator.languages);
  redirect(`/${defaultLocale}`);
}
