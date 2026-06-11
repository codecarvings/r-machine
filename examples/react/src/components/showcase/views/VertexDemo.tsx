import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug, VertexFrame } from "@/r-machine/toolset";

const widgetPlug = Plug({ counter: "vertex/counter" });
function CounterWidget({ label }: { label: string }) {
  const { counter } = widgetPlug.useR();
  return (
    <Button variant="outline" className="font-mono" onClick={counter.inc}>
      {label}: {counter.count}
    </Button>
  );
}

const framePlug = Plug({ counter: "vertex/counter" });
export function VertexDemo() {
  const { counter } = framePlug.useR();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Independent — no frame</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <CounterWidget label="A" />
          <CounterWidget label="B" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shared — inside a VertexFrame</CardTitle>
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

      <p className="text-xs text-muted-foreground">
        A and B are independent instances. C and D share one instance via the frame — increment either and both move.
      </p>
    </div>
  );
}
