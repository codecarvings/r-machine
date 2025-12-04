import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import GitHubMark from "@/components/gfx/github-mark.svg";
import RMachineLogo from "@/components/gfx/r-machine.logo.svg";
import { Button } from "@/components/ui/button";
import { getPathBuilder, pickR } from "@/r-machine/server-toolset";

export default async function Hero() {
  // Load the required localized resource
  const r = await pickR("landing-page");
  // Get path builder for creating locale-aware links
  const getPath = await getPathBuilder();

  return (
    <section className="relative w-full py-12 sm:py-16 lg:py-20 bg-linear-to-br from-gray-200 via-gray-100 to-slate-100">
      <div className="absolute inset-0 bg-linear-to-t from-background/50 to-transparent" />
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Logo on top for small screens, on right for large screens */}
            <div className="shrink-0 lg:order-2">
              <Image src={RMachineLogo} alt="R-Machine Logo" className="size-32 sm:size-40 lg:size-64" />
            </div>

            {/* Content on the left for large screens */}
            <div className="flex-1 text-center lg:text-left space-y-6 lg:order-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
                {r.hero.title}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">{r.hero.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center lg:items-start">
                <Link href={getPath("start-now")} className="flex items-center">
                  <Button size="lg" className="gap-2 text-base">
                    <ArrowRight className="size-4" />
                    {r.hero.cta.primary}
                  </Button>
                </Link>
                <a href="https://github.com/codecarvings/r-machine" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="gap-2 text-base">
                    <Image src={GitHubMark} alt="GitHub Logo" className="size-4" />
                    {r.hero.cta.secondary}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
