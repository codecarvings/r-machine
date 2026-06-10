import { RoutePlayground } from "@/components/client/route-playground";
import { TimerCard } from "@/components/client/TimerCard";
import Hero from "@/components/server/hero";
import { bindLocale } from "@/r-machine/server-toolset";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  // The page reads no server resource itself, so bind the locale explicitly
  // for the server-rendered children (Hero) before they call useR().
  await bindLocale(params);

  return (
    <>
      <Hero />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <TimerCard />
          <RoutePlayground />
        </div>
      </section>
    </>
  );
}
