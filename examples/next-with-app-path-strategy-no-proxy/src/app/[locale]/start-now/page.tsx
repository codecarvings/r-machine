import { bindLocale } from "@/r-machine/server-toolset";

export default async function StartNowPage({ params }: PageProps<"/[locale]">) {
  // Bind the locale based on the route parameter
  await bindLocale(params);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="min-h-92 flex flex-col items-center justify-center">
        <p>TODO</p>
      </div>
    </section>
  );
}
