import "../globals.css";
import { DelayedSuspense } from "@r-machine/react/utils";
import type { Metadata } from "next";
import ContentLoading from "@/components/server/content-loading";
import Footer from "@/components/server/footer";
import Header from "@/components/server/header";
import { generateLocaleStaticParams, NextServerRMachine, ServerPlug } from "@/r-machine/server-toolset";

// Pre-render the static params for all locales
export const generateStaticParams = generateLocaleStaticParams;
export const dynamicParams = false;

// Generate dynamic metadata based on the locale
const metaPlug = ServerPlug("shell/common");
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  // biome-ignore lint/correctness/useHookAtTopLevel: This is not a Hook
  const [s] = await metaPlug.useUnboundR(params);

  return {
    title: s.title,
  };
}
generateMetadata.plug = metaPlug;

const pagePlug = ServerPlug();
export default async function LocaleLayout({ params, children }: LayoutProps<"/[locale]">) {
  const { $ } = await pagePlug.useR(params);

  return (
    <html lang={$.locale}>
      <body>
        <NextServerRMachine>
          <DelayedSuspense fallback={<ContentLoading />}>
            <div className="min-h-screen bg-background">
              <Header />
              {children}
              <Footer />
            </div>
          </DelayedSuspense>
        </NextServerRMachine>
      </body>
    </html>
  );
}
LocaleLayout.plug = pagePlug;
