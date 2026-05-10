import { Suspense } from "react";
import Box3 from "@/components/client/box3";
import FeaturesTitle from "@/components/client/features-title";
import IntlDemo from "@/components/client/intl-demo";
import FeatureBox from "@/components/server/feature-box";
import FeatureBoxLoading from "@/components/server/feature-box-loading";
import Hero from "@/components/server/hero";
import { ServerPlug } from "@/r-machine/server-toolset";

export const plug = ServerPlug("shell/features/box_1_2");
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const [features] = await plug.useR(params);

  return (
    <>
      <Hero />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <FeaturesTitle />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureBox badge={features.box1.badge} title={features.box1.title}>
              {features.box1.description}
            </FeatureBox>
            <FeatureBox badge={features.box2.badge} title={features.box2.title}>
              {features.box2.description}
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
