import { Plug } from "./r-machine/toolset";

export const plug = Plug({ page: "shell/landing-page", fmt: "shell/lib/fmt" });
export default function WipLandingPage() {
  const { page, fmt, $ } = plug.use();

  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{page.features.title}</h2>
            <p className="text-lg text-muted-foreground">{page.features.subtitle}</p>
          </div>
          {fmt.time(new Date())} - {$.locale}
        </div>
      </section>
    </div>
  );
}
