import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerPlug } from "@/r-machine/server-toolset";

const plug = ServerPlug("shell/example-static", "shell/navigation");
export default async function Page1({ params }: PageProps<"/[locale]/example-static/page-1">) {
  const [se, sn, $] = await plug.useR(params);

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{se.page1.title}</CardTitle>
            <CardDescription>{se.page1.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{se.page1.feature}</p>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={$.getPath("/")}>{sn.home}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={$.getPath("/example-static/page-2")}>{sn.exampleStatic.page2.label}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
Page1.plug = plug;
