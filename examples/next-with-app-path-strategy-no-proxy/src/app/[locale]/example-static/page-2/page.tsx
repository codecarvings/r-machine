import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bindLocale, getPathComposer, pickR } from "@/r-machine/server-toolset";

export default async function Page2({ params }: PageProps<"/[locale]/example-static/page-2">) {
  await bindLocale(params);
  const r = await pickR("example-static");
  const getPath = await getPathComposer();

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{r.page2.title}</CardTitle>
            <CardDescription>{r.page2.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{r.page2.feature}</p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={getPath("/")}>Home</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={getPath("/example-static/page-1")}>Page 1</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
