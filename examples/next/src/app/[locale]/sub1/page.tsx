import Link from "next/link";
import { ServerPlug } from "@/r-machine/server-toolset";

const plug = ServerPlug();
export default async function HomePage({ params }: PageProps<"/[locale]/sub1">) {
  const { $ } = await plug.useR(params);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto">
        <Link href={$.getPath("/")} className="text-primary underline">
          Home
        </Link>
      </div>
    </section>
  );
}
