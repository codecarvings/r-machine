import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bindLocale, getPathComposer, pickR } from "@/r-machine/server-toolset";

export default async function ExampleDynamicPage({ params }: PageProps<"/[locale]/example-dynamic">) {
  await bindLocale(params);
  const r = await pickR("example-dynamic");
  const getPath = await getPathComposer();

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{r.list.title}</CardTitle>
            <CardDescription>{r.list.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{r.list.feature}</p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {r.items.map((item) => (
            <Button key={item.slug} variant="outline" className="w-full justify-start" asChild>
              <Link href={getPath("/example-dynamic/[slug]", { slug: item.slug })}>{item.title}</Link>
            </Button>
          ))}
        </div>

        <Button variant="ghost" asChild>
          <Link href={getPath("/")}>← Home</Link>
        </Button>
      </div>
    </section>
  );
}
