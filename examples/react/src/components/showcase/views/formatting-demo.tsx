import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plug } from "@/r-machine/toolset";

const sampleDate = new Date(2025, 5, 15, 10, 30);
const sampleAmount = 1234.56;

const plug = Plug("shell/lib/fmt", "shell/showcase");
export function FormattingDemo() {
  const [fmt, s] = plug.useR();
  const [count, setCount] = useState(2);
  const f = s.formatting;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <Row label={f.dateLabel} value={fmt.date.long(sampleDate)} />
        <Row label={f.numberLabel} value={fmt.number(sampleAmount)} />
        <Row label={f.currencyLabel} value={fmt.currency(sampleAmount)} />

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">{f.pluralLabel}</div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setCount(Math.max(0, count - 1))}>
              −
            </Button>
            <span className="font-mono">{fmt.plural(count, f.unit.one, f.unit.other)}</span>
            <Button size="sm" variant="outline" onClick={() => setCount(count + 1)}>
              +
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Switch locale (top-right) — number grouping, currency and plural rules all change with it.
        </p>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b pb-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
