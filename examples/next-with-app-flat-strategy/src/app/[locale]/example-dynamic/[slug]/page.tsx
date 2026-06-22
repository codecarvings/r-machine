import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerPlug } from "@/r-machine/server-toolset";

// Generate static params for dynamic routes
const paramsPlug = ServerPlug("shell/example-dynamic");
export async function generateStaticParams({
  params: { locale },
}: {
  params: Awaited<PageProps<"/[locale]/example-dynamic/[slug]">["params"]>;
}) {
  // biome-ignore lint/correctness/useHookAtTopLevel: This is not a Hook
  const [dynamic] = await paramsPlug.useUnboundR(locale); // No need to bind locale
  return dynamic.items.map((item: any) => ({ slug: item.slug }));
}
generateStaticParams.plug = paramsPlug;

const pagePlug = ServerPlug("shell/example-dynamic");
export default async function DynamicSlugPage({ params }: PageProps<"/[locale]/example-dynamic/[slug]">) {
  const [s, $] = await pagePlug.useR(params);

  const item = s.items.find((i: any) => i.slug === $.params.slug);

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
            <p className="text-sm text-muted-foreground">{s.detail.feature}</p>
          </CardContent>
        </Card>

        <Button variant="ghost" asChild>
          <Link href={$.getPath("/example-dynamic")}>← {s.detail.backLink}</Link>
        </Button>
      </div>
    </section>
  );
}
DynamicSlugPage.plug = pagePlug;
