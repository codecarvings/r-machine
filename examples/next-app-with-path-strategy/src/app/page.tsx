import { redirect } from "next/navigation";
import { rMachine } from "@/r-machine/r-machine";

export default function Page() {
  redirect(`/${rMachine.config.defaultLocale}`);
}
