import { DelayedSuspense } from "@r-machine/react/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plug } from "@/r-machine/toolset";

// `base/preview` resolves the showcase shell in EVERY configured locale (via a
// `res.perLocale` loader) and returns them side by side. This panel therefore
// shows all translations at once — and never changes when the app locale flips.
const plug = Plug("base/preview", "shell/showcase");

function CrossLocaleContent() {
  const [translations, s, $] = plug.useR();

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center gap-2 text-sm">
          {s.views.crossLocale.ambientLabel}: <Badge variant="secondary">{$.locale}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(translations.preview).map(([loc, t]) => (
            <div key={loc} className="space-y-1 rounded-lg border p-3">
              <Badge>{loc}</Badge>
              <div className="font-medium">{t.appName}</div>
              <div className="text-sm text-muted-foreground">{t.tagline}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{s.views.crossLocale.panelNote}</p>
      </CardContent>
    </Card>
  );
}

export function CrossLocaleDemo() {
  return (
    <DelayedSuspense fallback={<Skeleton className="h-40 w-full rounded-lg" />}>
      <CrossLocaleContent />
    </DelayedSuspense>
  );
}
CrossLocaleDemo.plug = plug;
