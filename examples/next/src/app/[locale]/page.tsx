import { Suspense } from "react";
import { CatalogClient } from "@/components/client/catalog-client";
import CatalogSkeleton from "@/components/server/catalog-skeleton";
import { ServerPlug } from "@/r-machine/server-toolset";

// Reads the async `inner/catalog` (server-only) + `shell/catalog`. Awaiting the
// plug is what suspends — kept in a child component so the page-level <Suspense>
// can render the skeleton while the catalog port resolves.
const plug = ServerPlug("inner/catalog", "shell/catalog");
async function CatalogContent({ params }: PageProps<"/[locale]">) {
  const [catalog, s] = await plug.useR(params);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{s.heading}</h1>
        <p className="text-muted-foreground mt-1">{s.subtitle}</p>
      </div>
      <CatalogClient products={catalog.products} categories={catalog.categories} />
    </>
  );
}
CatalogContent.plug = plug;

export default function CatalogPage(props: PageProps<"/[locale]">) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogContent {...props} />
        </Suspense>
      </div>
    </section>
  );
}
