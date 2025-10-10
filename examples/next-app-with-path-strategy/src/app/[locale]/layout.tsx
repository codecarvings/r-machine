import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { NextRMachineProvider } from "@/r-machine/server-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const localeOption = (await params).locale;
  const rMachineProviderProps = { localeOption };
  const { isValidLocale, locale } = NextRMachineProvider.probe(rMachineProviderProps);
  if (!isValidLocale) {
    return notFound();
  }

  return (
    <NextRMachineProvider {...rMachineProviderProps}>
      <html lang={locale}>
        <body className={`${geistSans.variable}`}>
          <div>{locale}</div>
          {children}
        </body>
      </html>
    </NextRMachineProvider>
  );
}
