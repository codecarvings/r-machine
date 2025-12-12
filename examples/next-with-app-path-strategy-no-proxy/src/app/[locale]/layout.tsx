import "../globals.css";
import { DelayedSuspense } from "@r-machine/react/utils";
import type { Metadata } from "next";
import ContentLoading from "@/components/server/content-loading";
import Footer from "@/components/server/footer";
import Header from "@/components/server/header";
import { bindLocale, generateLocaleStaticParams, NextServerRMachine, pickR } from "@/r-machine/server-toolset";

// Pre-render the static params for all locales
export const generateStaticParams = generateLocaleStaticParams;
export const dynamicParams = false;

// Generate dynamic metadata based on the locale
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await bindLocale(params);
  const r = await pickR("common");

  return {
    title: r.title(locale),
  };
}

export default async function LocaleLayout({ params, children }: LayoutProps<"/[locale]">) {
  // Bind the locale based on the route parameter
  const { locale } = await bindLocale(params);

  // Load the required localized resources
  const r = await pickR("common");

  return (
    <html lang={locale}>
      <body>
        <NextServerRMachine>
          <DelayedSuspense fallback={<ContentLoading />}>
            <div className="min-h-screen bg-background">
              <Header />
              {children}
              <Footer r={r.footer} />
            </div>
          </DelayedSuspense>
        </NextServerRMachine>
      </body>
    </html>
  );
}
