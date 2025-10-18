import { Geist } from "next/font/google";
import "./globals.css";
import { bindLocale, generateLocaleStaticParams, NextServerRMachine } from "@/r-machine/server-tools";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const generateStaticParams = generateLocaleStaticParams;

export default async function LocaleLayout({ params, children }: LayoutProps<"/[locale]">) {
  const locale = await bindLocale(params);

  return (
    <NextServerRMachine>
      <html lang={locale}>
        <body className={`${geistSans.variable}`}>{children}</body>
      </html>
    </NextServerRMachine>
  );
}
