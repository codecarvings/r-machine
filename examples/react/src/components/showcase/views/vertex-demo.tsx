import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug, VertexFrame } from "@/r-machine/toolset";

const widgetPlug = Plug("vertex/counter");
function CounterWidget({ label }: { label: string }) {
  const [counter] = widgetPlug.useR();

  return (
    <Button variant="outline" className="font-mono" onClick={counter.inc}>
      {label}: {counter.count}
    </Button>
  );
}

const framePlug = Plug({ counter: "vertex/counter", showcase: "shell/showcase" });
export function VertexDemo() {
  const { counter, showcase: s } = framePlug.useR();
  const t = s.views.vertex;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.independentTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <CounterWidget label="A" />
          <CounterWidget label="B" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.sharedTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <VertexFrame gear={[counter]}>
            <div className="flex gap-3">
              <CounterWidget label="C" />
              <CounterWidget label="D" />
            </div>
          </VertexFrame>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{t.note}</p>
    </div>
  );
}
