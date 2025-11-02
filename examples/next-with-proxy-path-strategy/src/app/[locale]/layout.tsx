import { Geist } from "next/font/google";
import "./globals.css";
import { generateLocaleStaticParams, getLocale, NextServerRMachine } from "@/r-machine/server-toolset";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const __generateStaticParams = generateLocaleStaticParams;

export async function LocaleLayout2({ children }: { children: React.ReactNode }) {
  const locale = getLocale();

  return (
    <NextServerRMachine>
      <html lang={locale}>
        <body className={`${geistSans.variable}`}>{children}</body>
      </html>
    </NextServerRMachine>
  );
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const data = await params;
  console.log("LAYOUT PARAMS:", data);
  return (
    <html lang="en">
      <body className={`${geistSans.variable}`}>
        <div>PROVA</div>
      </body>
    </html>
  );
}
