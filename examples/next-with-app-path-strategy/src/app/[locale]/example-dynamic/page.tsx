import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerPlug } from "@/r-machine/server-toolset";

const plug = ServerPlug("shell/example-dynamic", "shell/navigation");
export default async function ExampleDynamicPage({ params }: PageProps<"/[locale]/example-dynamic">) {
  const [dynamic, nav, $] = await plug.useR(params);

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{dynamic.list.title}</CardTitle>
            <CardDescription>{dynamic.list.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{dynamic.list.feature}</p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {dynamic.items.map((item) => (
            <Button key={item.slug} variant="outline" className="w-full justify-start" asChild>
              <Link href={$.getPath("/example-dynamic/[slug]", { slug: item.slug })}>{item.title}</Link>
            </Button>
          ))}
        </div>

        <Button variant="ghost" asChild>
          <Link href={$.getPath("/")}>← {nav.home}</Link>
        </Button>
      </div>
    </section>
  );
}
