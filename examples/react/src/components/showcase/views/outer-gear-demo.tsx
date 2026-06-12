import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plug } from "@/r-machine/toolset";

export const plug = Plug("outer/timer");
export function OuterGearDemo() {
  const [timer] = plug.useR();

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-4xl font-bold tabular-nums">{timer.value}</span>
          <Badge variant={timer.isOdd ? "default" : "secondary"}>{timer.isOdd ? "odd" : "even"}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          doubled (memoized cell): <span className="font-mono">{timer.doubled}</span>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => timer.add(1)}>+1</Button>
          <Button variant="secondary" onClick={() => timer.add(10)}>
            +10
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Auto-increments every second via an interval owned by the gear; a relay flips the odd/even badge.
        </p>
      </CardContent>
    </Card>
  );
}
