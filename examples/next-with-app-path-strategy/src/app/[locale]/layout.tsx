import "../globals.css";
import { DelayedSuspense } from "@r-machine/react/utils";
import ContentLoading from "@/components/server/content-loading";
import Footer from "@/components/server/footer";
import Header from "@/components/server/header";
import { generateLocaleStaticParams, NextServerRMachine, ServerPlug } from "@/r-machine/server-toolset";

// Pre-render the static params for all locales
export const generateStaticParams = generateLocaleStaticParams;
export const dynamicParams = false;

/*
// ----- SKIP THIS PART ----
// Generate dynamic metadata based on the locale
export const metaPlug = ServerPlug("shell/common");
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await bindLocale(params);
  const [common, $] = await metaPlug.useR(params, false);

  return {
    title: common.title(locale),
  };
}
*/

export const pagePlug = ServerPlug("shell/common");
export default async function LocaleLayout({ params, children }: LayoutProps<"/[locale]">) {
  const [common, $] = await pagePlug.useR(params);

  return (
    <html lang={$.params.locale}>
      <body>
        <NextServerRMachine>
          <DelayedSuspense fallback={<ContentLoading />}>
            <div className="min-h-screen bg-background">
              <Header />
              {children}
              <Footer r={common.footer} />
            </div>
          </DelayedSuspense>
        </NextServerRMachine>
      </body>
    </html>
  );
}
