import { NextRMachineProvider } from "next-r-machine";
import { rMachineConfigFactory } from "@/r-machine/config";

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const locale = (await params).locale;

  return (
    <NextRMachineProvider configFactory={rMachineConfigFactory} locale={locale}>
      {children}
    </NextRMachineProvider>
  );
}
