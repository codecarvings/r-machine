import "../globals.css";
import Footer from "@/components/server/footer";
import Header from "@/components/server/header";
import { rMachine } from "@/r-machine/r-machine";
import { generateLocaleStaticParams } from "@/r-machine/server-toolset";

// Pre-render the static params for all locales
export const generateStaticParams = generateLocaleStaticParams;

export default async function NonLocalizedLayout({ children }: LayoutProps<"/">) {
  // Load the required localized resources directly from the underlying rMachine instance, using the default locale
  const rCommon = await rMachine.pickR(rMachine.config.defaultLocale, "common");

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-background">
          <Header showLocaleSwitcher={false} />
          {children}
          <Footer r={rCommon.footer} />
        </div>
      </body>
    </html>
  );
}
