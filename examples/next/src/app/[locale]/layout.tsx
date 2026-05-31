import "../globals.css";
import { DelayedSuspense } from "@r-machine/react/utils";
import type { Metadata } from "next";
import { ExpVertex1 } from "@/components/client/ExpVertex1";
import ContentLoading from "@/components/server/content-loading";
import Footer from "@/components/server/footer";
import Header from "@/components/server/header";
import { generateLocaleStaticParams, NextServerRMachine, ServerPlug } from "@/r-machine/server-toolset";

// Pre-render the static params for all locales
export const generateStaticParams = generateLocaleStaticParams;
export const dynamicParams = false;

// Generate dynamic metadata based on the locale
export const metaPlug = ServerPlug("shell/common");
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  // biome-ignore lint/correctness/useHookAtTopLevel: This is not a Hook
  const [common] = await metaPlug.useUnboundR(params);

  return {
    title: common.title,
  };
}

export const pagePlug = ServerPlug("shell/common");
export default async function LocaleLayout({ params, children }: LayoutProps<"/[locale]">) {
  const [common, $] = await pagePlug.useR(params);

  return (
    <html lang={$.locale}>
      <body>
        <NextServerRMachine>
          <DelayedSuspense fallback={<ContentLoading />}>
            <div className="min-h-screen bg-background">
              <Header />
              {children}
              <ExpVertex1 title="Vertex Timer Layout 1" />
              <Footer r={common.footer} />
            </div>
          </DelayedSuspense>
        </NextServerRMachine>
      </body>
    </html>
  );
}
