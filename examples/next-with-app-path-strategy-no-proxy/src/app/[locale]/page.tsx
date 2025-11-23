import { Suspense } from "react";
import Box3 from "@/components/client/box3";
import FeatureBox from "@/components/client/feature-box";
import FeatureBoxLoading from "@/components/client/feature-box-loading";
import Header from "@/components/client/header";
import Hero from "@/components/client/hero";
import { bindLocale, pickRKit } from "@/r-machine/server-toolset";

export default async function Home({ params }: PageProps<"/[locale]">) {
  // Bind the locale based on the route parameter
  await bindLocale(params);

  // Load the required localized resources
  const [rPage, rBoxes, rCommon] = await pickRKit("landing-page", "features/box_1_2", "common");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{rPage.features.title}</h2>
            <p className="text-lg text-muted-foreground">{rPage.features.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureBox feature={rBoxes.box1} />
            <FeatureBox feature={rBoxes.box2} />
            <Suspense fallback={<FeatureBoxLoading />}>
              <Box3 />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="border-t border-gray-200 py-8">
            <p className="text-sm text-gray-500">{rCommon.footer.message}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
