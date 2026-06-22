import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/client/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { ServerPlug } from "@/r-machine/server-toolset";

// Server component: reads `inner/catalog` (looks the product up by id) plus the
// `shell/product` and `shell/catalog` chrome. The price is formatted server-side
// via the `fmt` kit; the only interactive bit (Add to cart) is delegated to a
// client island that receives the product as plain props.
const plug = ServerPlug("inner/catalog", "shell/product", "shell/catalog");
export default async function ProductPage({ params }: PageProps<"/[locale]/product/[id]">) {
  const [catalog, sp, sc, $] = await plug.useR(params);

  const product = catalog.byId($.params.id);
  if (!product) {
    notFound();
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link href={$.getPath("/")} className="text-sm text-primary underline">
          {sp.backToCatalog}
        </Link>

        <div className="space-y-3">
          <Badge variant="secondary">{sc.category[product.category as keyof typeof sc.category]}</Badge>
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-muted-foreground">{product.blurb}</p>
        </div>

        <p className="text-4xl font-bold tabular-nums">{$.kit.fmt.currency(product.price)}</p>
        <p className="text-sm text-green-600 font-medium">{sp.inStock}</p>

        <AddToCartButton product={{ id: product.id, name: product.name, price: product.price }} />
      </div>
    </section>
  );
}
ProductPage.plug = plug;
