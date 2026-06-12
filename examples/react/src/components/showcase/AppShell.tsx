import { DelayedSuspense } from "@r-machine/react/utils";
import { LocaleSwitcher } from "@/components/client/LocaleSwitcher";
import RMachineLogo from "@/gfx/r-machine.logo.svg";
import { Plug } from "@/r-machine/toolset";
import { FeatureView } from "./FeatureView";
import { Sidebar } from "./Sidebar";

export const plug = Plug("outer/nav", "shell/showcase");
export function AppShell() {
  const [nav, s] = plug.useR();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={RMachineLogo} alt="R-Machine" className="size-8" />
            <div>
              <div className="font-semibold leading-none">{s.appName}</div>
              <div className="text-xs text-muted-foreground">{s.tagline}</div>
            </div>
          </div>
          <LocaleSwitcher />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 md:flex-row">
        <aside className="md:w-56 md:shrink-0">
          <Sidebar />
        </aside>
        <main className="min-w-0 flex-1">
          <DelayedSuspense>
            <FeatureView view={nav.view} />
          </DelayedSuspense>
        </main>
      </div>
    </div>
  );
}
