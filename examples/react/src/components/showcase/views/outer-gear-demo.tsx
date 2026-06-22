import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plug } from "@/r-machine/toolset";

const plug = Plug("outer/timer", "shell/showcase");
export function OuterGearDemo() {
  const [timer, s] = plug.useR();
  const labels = s.views["outer-gear"];

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-4xl font-bold tabular-nums">{timer.value}</span>
          <Badge variant={timer.isOdd ? "default" : "secondary"}>
            {timer.isOdd ? labels.oddLabel : labels.evenLabel}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {labels.doubledLabel} <span className="font-mono">{timer.doubled}</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => timer.add(1)}>+1</Button>
          <Button variant="secondary" onClick={() => timer.add(10)}>
            +10
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{labels.note}</p>
      </CardContent>
    </Card>
  );
}
OuterGearDemo.plug = plug;
