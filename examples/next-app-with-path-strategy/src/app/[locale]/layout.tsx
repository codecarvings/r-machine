import { Geist } from "next/font/google";
import "./globals.css";
import { applyLocale, NextServerRMachine } from "@/r-machine/server-tools";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default async function LocaleLayout({ params, children }: LayoutProps<"/[locale]">) {
  const locale = applyLocale((await params).locale);

  return (
    <NextServerRMachine>
      <html lang={locale}>
        <body className={`${geistSans.variable}`}>{children}</body>
      </html>
    </NextServerRMachine>
  );
}
