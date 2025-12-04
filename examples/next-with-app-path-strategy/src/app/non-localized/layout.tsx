import { Geist } from "next/font/google";
import "../globals.css";
import { generateLocaleStaticParams } from "@/r-machine/server-toolset";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const generateStaticParams = generateLocaleStaticParams;

export default async function LocaleLayout({ children }: LayoutProps<"/non-localized">) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable}`}>{children}</body>
    </html>
  );
}
