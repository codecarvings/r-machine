import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bindLocale, getPathComposer, pickRKit } from "@/r-machine/server-toolset";

export default async function ExampleDynamicPage({ params }: PageProps<"/[locale]/example-dynamic">) {
  await bindLocale(params);
  const [rDynamic, rNav] = await pickRKit("example-dynamic", "navigation");
  const getPath = await getPathComposer();

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{rDynamic.list.title}</CardTitle>
            <CardDescription>{rDynamic.list.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{rDynamic.list.feature}</p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {rDynamic.items.map((item) => (
            <Button key={item.slug} variant="outline" className="w-full justify-start" asChild>
              <Link href={getPath("/example-dynamic/[slug]", { slug: item.slug })}>{item.title}</Link>
            </Button>
          ))}
        </div>

        <Button variant="ghost" asChild>
          <Link href={getPath("/")}>← {rNav.home}</Link>
        </Button>
      </div>
    </section>
  );
}
