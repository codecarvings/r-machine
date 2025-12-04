import { Suspense } from "react";
import { useRKit } from "@/r-machine/toolset";
import Box3 from "./components/client/Box3";
import FeatureBox from "./components/client/FeatureBox";
import FeatureBoxLoading from "./components/client/FeatureBoxLoading";
import Footer from "./components/client/Footer";
import Header from "./components/client/Header";
import Hero from "./components/client/Hero";

export default function LandingPage() {
  // Load the required localized resources
  const [rPage, rBoxes, rCommon] = useRKit("landing-page", "features/box_1_2", "common");

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

      <Footer r={rCommon.footer} />
    </div>
  );
}
