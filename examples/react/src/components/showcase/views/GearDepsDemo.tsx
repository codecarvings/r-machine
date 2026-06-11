import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plug } from "@/r-machine/toolset";

export const plug = Plug("outer/operator", "outer/timer");
export function GearDepsDemo() {
  const [operator, timer] = plug.useR();

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid grid-cols-2 gap-4 font-mono text-sm">
          <div>
            timer.value: <b>{timer.value}</b>
          </div>
          <div>
            operator.negative: <b>{operator.negative}</b>
          </div>
        </div>
        <Button onClick={operator.add10}>operator.add10() → timer.add(10)</Button>
        <p className="text-xs text-muted-foreground">
          operator depends on timer (by token). Its getter derives from the timer, and its action commands it.
        </p>
      </CardContent>
    </Card>
  );
}
