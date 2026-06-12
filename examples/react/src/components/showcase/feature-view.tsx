import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ViewId } from "@/r-machine/outer/nav";
import { Plug } from "@/r-machine/toolset";
import { CodeBlock } from "./code-block";
import { VIEWS } from "./views/registry";

export const plug = Plug("shell/showcase");
export function FeatureView({ view }: { view: ViewId }) {
  const [s] = plug.useR();
  const meta = s.views[view];
  const entry = VIEWS[view];
  const Demo = entry.Demo;

  return (
    // key={view} resets the Demo/Source tab back to "Demo" on each view change
    <div key={view} className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{meta.heading}</h1>
        <p className="text-muted-foreground">{meta.blurb}</p>
      </div>

      <Tabs defaultValue="demo">
        <TabsList>
          <TabsTrigger value="demo">Demo</TabsTrigger>
          <TabsTrigger value="source">Source</TabsTrigger>
        </TabsList>
        <TabsContent value="demo" className="pt-4">
          <Demo />
        </TabsContent>
        <TabsContent value="source" className="space-y-4 pt-4">
          {entry.sources.map((src) => (
            <div key={src.label} className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">{src.label}</div>
              <CodeBlock code={src.code} lang={src.lang} />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
