import { NextRMachineProvider } from "@/r-machine/next-r-machine";

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const locale = (await params).locale;

  return <NextRMachineProvider locale={locale}>{children}</NextRMachineProvider>;
}
