import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { bindLocale, getPathComposer, pickRKit } from "@/r-machine/server-toolset";

export default async function Page1({ params }: PageProps<"/[locale]/example-static/page-1">) {
  await bindLocale(params);
  const [rStatic, rNav] = await pickRKit("example-static", "navigation");
  const getPath = await getPathComposer();

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{rStatic.page1.title}</CardTitle>
            <CardDescription>{rStatic.page1.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{rStatic.page1.feature}</p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={getPath("/")}>{rNav.home}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={getPath("/example-static/page-2")}>{rNav.exampleStatic.page2.label}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
