import { Suspense } from "react";
import Box3 from "./components/client/Box3";
import Exp from "./components/client/Exp";
import Exp2 from "./components/client/Exp2";
import FeatureBox from "./components/client/FeatureBox";
import FeatureBoxLoading from "./components/client/FeatureBoxLoading";
import Footer from "./components/client/Footer";
import Header from "./components/client/Header";
import Hero from "./components/client/Hero";
import IntlDemo from "./components/client/IntlDemo";
import { Plug } from "./r-machine/toolset";

export const plug = Plug("shell/landing-page", "shell/features/box_1_2", "shell/common");
export default function LandingPage() {
  const [page, boxes, common] = plug.useR();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <Hero />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <Exp />
          <Exp2 />
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{page.features.title}</h2>
            <p className="text-lg text-muted-foreground">{page.features.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureBox badge={boxes.box1.badge} title={boxes.box1.title}>
              {boxes.box1.description}
            </FeatureBox>
            <FeatureBox badge={boxes.box2.badge} title={boxes.box2.title}>
              {boxes.box2.description}
            </FeatureBox>
            <Suspense fallback={<FeatureBoxLoading />}>
              <Box3 />
            </Suspense>
          </div>
        </div>
      </section>

      <IntlDemo />

      <Footer common={common.footer} />
    </div>
  );
}
