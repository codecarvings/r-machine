import { DelayedSuspense } from "@r-machine/react/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plug } from "@/r-machine/toolset";

const plug = Plug("shell/async-demo");
function AsyncContent() {
  const [data] = plug.useR();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge>{data.badge}</Badge>
          <CardTitle className="text-base">{data.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{data.body}</CardContent>
    </Card>
  );
}

export function AsyncDemo() {
  return (
    <DelayedSuspense fallback={<Skeleton className="h-28 w-full rounded-lg" />}>
      <AsyncContent />
    </DelayedSuspense>
  );
}
