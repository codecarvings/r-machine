import { notFound } from "next/navigation";
import { rMachine } from "@/r-machine/r-machine";
import { NextRMachineProvider } from "@/r-machine/server-context";

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const locale = (await params).locale;
  if (!rMachine.localeHelper.isValidLocale(locale)) {
    return notFound();
  }

  return <NextRMachineProvider localeOption={locale}>{children}</NextRMachineProvider>;
}
