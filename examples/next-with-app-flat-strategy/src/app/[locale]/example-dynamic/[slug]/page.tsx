import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerPlug } from "@/r-machine/server-toolset";

// Generate static params for dynamic routes
export const paramsPlug = ServerPlug("shell/example-dynamic");
export async function generateStaticParams({
  params: { locale },
}: {
  params: Awaited<PageProps<"/[locale]/example-dynamic/[slug]">["params"]>;
}) {
  // biome-ignore lint/correctness/useHookAtTopLevel: This is not a Hook
  const [r] = await paramsPlug.useUnboundR(locale); // No need to bind locale
  return r.items.map((item) => ({ slug: item.slug }));
}

export const pagePlug = ServerPlug("shell/example-dynamic");
export default async function DynamicSlugPage({ params }: PageProps<"/[locale]/example-dynamic/[slug]">) {
  const [example, $] = await pagePlug.useR(params);

  const item = example.items.find((i) => i.slug === $.params.slug);

  if (!item) {
    notFound();
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>slug: {$.params.slug}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{example.detail.feature}</p>
          </CardContent>
        </Card>

        <Button variant="ghost" asChild>
          <Link href={$.getPath("/example-dynamic")}>← {example.detail.backLink}</Link>
        </Button>
      </div>
    </section>
  );
}
