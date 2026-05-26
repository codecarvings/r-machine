import Link from "next/link";
import { ExpOuter1 } from "@/components/client/ExpOuter1";
import { ExpVertex1 } from "@/components/client/ExpVertex1";
import { ExpVertex3 } from "@/components/client/ExpVertex3";
import { ExpVertexFrame1 } from "@/components/client/ExpVertexFrame1";
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
          <ExpOuter1 />
          <ExpVertex1 title="Vertex Timer Page 1" />
          <ExpVertexFrame1 />
          <br />
          <br />
          <ExpVertex3 title="Vertex Timer Page 3" />
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
