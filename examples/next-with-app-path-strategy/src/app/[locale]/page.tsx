import FeaturesTitle from "@/components/client/features-title";
import Hero from "@/components/server/hero";
import { ServerPlug } from "@/r-machine/server-toolset";

export const plug = ServerPlug("shell/features/box_1_2");
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const [features] = await plug.use(params);

  return (
    <>
      <Hero />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <FeaturesTitle />
          </div>
        </div>
      </section>
    </>
  );
}
