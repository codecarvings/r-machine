import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plug } from "@/r-machine/toolset";

const plug = Plug("outer/nav", "shell/showcase");
export function IntroDemo() {
  const [nav, s] = plug.useR();
  const t = s.views.intro;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.cardTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {t.sidebarNotePre} <code className="rounded bg-muted px-1 py-0.5">outer/nav</code> {t.sidebarNotePost}
        </p>
        <div className="flex items-center gap-2 text-sm">
          {t.activeViewLabel}: <Badge variant="secondary">{nav.view}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{t.hmrNote}</p>
      </CardContent>
    </Card>
  );
}
IntroDemo.plug = plug;
