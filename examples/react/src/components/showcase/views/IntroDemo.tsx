import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug } from "@/r-machine/toolset";

export const plug = Plug("outer/nav");
export function IntroDemo() {
  const [nav] = plug.useR();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Navigation state</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          The sidebar reads and writes a single OuterGear. The active view below is just{" "}
          <code className="rounded bg-muted px-1 py-0.5">outer/nav</code> state:
        </p>
        <div className="flex items-center gap-2 text-sm">
          active view: <Badge variant="secondary">{nav.view}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Edit a resource and save — thanks to HMR, the OuterGear keeps its state and this selection persists.
        </p>
      </CardContent>
    </Card>
  );
}
