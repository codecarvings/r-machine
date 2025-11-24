import "../globals.css";
import { DelayedSuspense } from "@r-machine/react/utils";
import ContentLoading from "@/components/server/content-loading";
import Footer from "@/components/server/footer";
import Header from "@/components/server/header";
import { bindLocale, generateLocaleStaticParams, NextServerRMachine, pickR } from "@/r-machine/server-toolset";

// Pre-render the static params for all locales
export const generateStaticParams = generateLocaleStaticParams;

export default async function LocaleLayout({ params, children }: LayoutProps<"/[locale]">) {
  // Bind the locale based on the route parameter
  const { locale } = await bindLocale(params);

  // Load the required localized resources
  const r = await pickR("common");

  return (
    <NextServerRMachine>
      <html lang={locale}>
        <body>
          <DelayedSuspense fallback={<ContentLoading />}>
            <div className="min-h-screen bg-background">
              <Header />
              {children}
              <Footer r={r.footer} />
            </div>
          </DelayedSuspense>
        </body>
      </html>
    </NextServerRMachine>
  );
}
