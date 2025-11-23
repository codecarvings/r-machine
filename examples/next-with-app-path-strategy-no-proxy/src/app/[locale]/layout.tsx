import "../globals.css";
import { bindLocale, generateLocaleStaticParams, NextServerRMachine } from "@/r-machine/server-toolset";

// Pre-render the static params for all locales
export const generateStaticParams = generateLocaleStaticParams;

export default async function LocaleLayout({ params, children }: LayoutProps<"/[locale]">) {
  const { locale } = await bindLocale(params);

  return (
    <NextServerRMachine>
      <html lang={locale}>
        <body>{children}</body>
      </html>
    </NextServerRMachine>
  );
}
