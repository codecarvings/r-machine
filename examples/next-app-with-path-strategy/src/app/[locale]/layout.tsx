import { Geist } from "next/font/google";
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
  const locale = (await params).locale;

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable}`}>
        <div>{locale}</div>
        {children}
      </body>
    </html>
  );
}
