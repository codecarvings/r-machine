import { ArrowLeft, BookOpen, Code2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { bindLocale, getPathComposer, pickR } from "@/r-machine/server-toolset";

export default async function StartNowPage({ params }: PageProps<"/[locale]">) {
  // Bind the locale based on the route parameter
  await bindLocale(params);

  // Load the required localized resource
  const r = await pickR("start-now-page");

  // Get path composer for creating locale-aware links
  const getPath = await getPathComposer();

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
      <div className="max-w-6xl mx-auto space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">{r.documentation.title}</h2>
          </div>
          <Card className="relative overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm gap-0">
            <CardHeader>
              <CardDescription>{r.documentation.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={r.documentation.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:underline font-semibold"
              >
                {r.documentation.link}
                <ExternalLink className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Code2 className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">{r.examples.title}</h2>
          </div>
          <Card className="relative overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardDescription>{r.examples.description}</CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section>
          <Button asChild>
            <Link href={getPath("/")}>
              <ArrowLeft />
              {r.backToHome}
            </Link>
          </Button>
        </section>
      </div>
    </main>
  );
}
