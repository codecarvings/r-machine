import { Suspense } from "react";
import Box3 from "@/components/client/box3";
import FeaturesTitle from "@/components/client/features-title";
import IntlDemo from "@/components/client/intl-demo";
import FeatureBox from "@/components/server/feature-box";
import FeatureBoxLoading from "@/components/server/feature-box-loading";
import Hero from "@/components/server/hero";
import { bindLocale, pickR } from "@/r-machine/server-toolset";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  // Bind the locale based on the route parameter
  await bindLocale(params);

  // Load the required localized resources
  const r = await pickR("features/box_1_2");

  return (
    <>
      <Hero />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <FeaturesTitle />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureBox badge={r.box1.badge} title={r.box1.title}>
              {r.box1.description}
            </FeatureBox>
            <FeatureBox badge={r.box2.badge} title={r.box2.title}>
              {r.box2.description}
            </FeatureBox>
            <Suspense fallback={<FeatureBoxLoading />}>
              <Box3 />
            </Suspense>
          </div>
        </div>
      </section>

      <IntlDemo />
    </>
  );
}
