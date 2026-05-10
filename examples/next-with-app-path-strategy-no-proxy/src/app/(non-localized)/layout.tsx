import "../globals.css";
import type { Metadata } from "next";
import Footer from "@/components/server/footer";
import NonLocalizedHeader from "@/components/server/non-localized-header";
import { generateLocaleStaticParams, ServerPlug } from "@/r-machine/server-toolset";
import { strategy } from "@/r-machine/setup";

// Pre-render the static params for all locales
export const generateStaticParams = generateLocaleStaticParams;

export const metadata: Metadata = {
  title: "R-Machine ⧹ Examples ⧹ Next App ⧹ Path Strategy (no proxy)",
};

export const plug = ServerPlug("shell/common");
export default async function NonLocalizedLayout({ children }: LayoutProps<"/">) {
  const [common] = await plug.useR(strategy.rMachine.defaultLocale);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background">
          <NonLocalizedHeader />
          {children}
          <Footer r={common.footer} />
        </div>
      </body>
    </html>
  );
}
