import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plug } from "@/r-machine/toolset";

export const plug = Plug("shell/showcase");
export function LocalizationDemo() {
  const [s, $] = plug.useR();

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center gap-2 text-sm">
          {s.localization.currentLocaleLabel}: <Badge variant="secondary">{$.locale}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{s.localization.note}</p>
        <p className="text-xs text-muted-foreground">
          Every heading, blurb and label in this app is a localized shell — switching locale re-resolves them all.
        </p>
      </CardContent>
    </Card>
  );
}
