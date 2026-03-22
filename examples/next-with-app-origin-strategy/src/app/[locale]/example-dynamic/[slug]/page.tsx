import Link from "next/link";
import { notFound } from "next/navigation";
import { getCanonicalUnicodeLocaleId } from "r-machine/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bindLocale, getPathComposer, pickR } from "@/r-machine/server-toolset";
import { type Locale, rMachine } from "@/r-machine/setup";

// Generate static params for dynamic routes
export async function generateStaticParams({
  params: { locale },
}: {
  params: Awaited<PageProps<"/[locale]/example-dynamic/[slug]">["params"]>;
}) {
  const r = await rMachine.pickR(getCanonicalUnicodeLocaleId(locale) as Locale, "example-dynamic");
  return r.items.map((item) => ({ slug: item.slug }));
}

export default async function DynamicSlugPage({ params }: PageProps<"/[locale]/example-dynamic/[slug]">) {
  await bindLocale(params);
  const r = await pickR("example-dynamic");
  const getPath = await getPathComposer();
  const { slug } = await params;

  const item = r.items.find((i) => i.slug === slug);

  if (!item) {
    notFound();
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>slug: {slug}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{r.detail.feature}</p>
          </CardContent>
        </Card>

        <Button variant="ghost" asChild>
          <Link href={getPath("/example-dynamic")}>← {r.detail.backLink}</Link>
        </Button>
      </div>
    </section>
  );
}
