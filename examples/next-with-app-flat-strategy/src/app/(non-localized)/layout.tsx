import "../globals.css";
import type { Metadata } from "next";
import Footer from "@/components/server/footer";
import NonLocalizedHeader from "@/components/server/non-localized-header";
import { generateLocaleStaticParams } from "@/r-machine/server-toolset";
import { rMachine } from "@/r-machine/setup";

// Pre-render the static params for all locales
export const generateStaticParams = generateLocaleStaticParams;

export const metadata: Metadata = {
  title: "R-Machine ⧹ Examples ⧹ Next App ⧹ Flat Strategy",
};

export default async function NonLocalizedLayout({ children }: LayoutProps<"/">) {
  // Load the required localized resources directly from the underlying rMachine instance, using the default locale
  const rCommon = await rMachine.pickR(rMachine.defaultLocale, "common");

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background">
          <NonLocalizedHeader />
          {children}
          <Footer r={rCommon.footer} />
        </div>
      </body>
    </html>
  );
}
