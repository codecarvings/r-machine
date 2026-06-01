import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/r-machine/inner/catalog";

// Presentational card. It receives an already-formatted `priceLabel` and the
// localized labels as props, so it has no resource dependencies of its own —
// the locale-aware bits are resolved by its (client) parent.
export function ProductCard({
  product,
  priceLabel,
  categoryLabel,
  viewDetailsLabel,
  href,
}: {
  product: Product;
  priceLabel: string;
  categoryLabel: string;
  viewDetailsLabel: string;
  href: string;
}) {
  return (
    <Card className="justify-between">
      <CardHeader>
        <Badge variant="secondary" className="mb-2">
          {categoryLabel}
        </Badge>
        <CardTitle className="text-lg">{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{product.blurb}</p>
        <p className="mt-4 text-2xl font-bold tabular-nums">{priceLabel}</p>
      </CardContent>
      <CardFooter>
        <Link href={href} className="text-primary underline text-sm font-medium">
          {viewDetailsLabel}
        </Link>
      </CardFooter>
    </Card>
  );
}
