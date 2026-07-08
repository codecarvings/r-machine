import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug } from "@/r-machine/toolset";

const plug = Plug("outer/nav", "shell/showcase");
export function IntroDemo() {
  const [nav, s] = plug.useR();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{s.views.intro.cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {s.views.intro.sidebarNotePre} <code className="rounded bg-muted px-1 py-0.5">outer/nav</code>{" "}
          {s.views.intro.sidebarNotePost}
        </p>
        <div className="flex items-center gap-2 text-sm">
          {s.views.intro.activeViewLabel}: <Badge variant="secondary">{nav.view}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{s.views.intro.hmrNote}</p>
      </CardContent>
    </Card>
  );
}
IntroDemo.plug = plug;
