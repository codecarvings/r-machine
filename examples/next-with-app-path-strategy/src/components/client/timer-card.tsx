"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientPlug } from "@/r-machine/client-toolset";

export const plug = ClientPlug("outer/timer", "shell/landing-page");
export function TimerCard() {
  const [timer, s, $] = plug.useR();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{s.timer.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Locale-aware plural — "5 seconds" / "5 secondi" */}
        <div className="text-4xl font-mono font-bold tabular-nums">
          {$.kit.fmt.plural(timer.value, s.timer.unit.one, s.timer.unit.other)}
        </div>
        <p className="text-sm text-muted-foreground">{s.timer.note}</p>
      </CardContent>
    </Card>
  );
}
