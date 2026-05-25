import Link from "next/link";
import { Exp } from "@/components/client/Exp";
import { Exp2 } from "@/components/client/Exp2";
import Hero from "@/components/server/hero";
import { ServerPlug } from "@/r-machine/server-toolset";

const plug = ServerPlug();
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { $ } = await plug.useR(params);

  return (
    <>
      <Hero />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <Exp />
          <Exp2 title="Timer 2" />
        </div>
      </section>
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <Link href={$.getPath("/sub1")} className="text-primary underline">
            Subpage 1
          </Link>
        </div>
      </section>
    </>
  );
}
