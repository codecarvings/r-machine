import { Calendar, Hash, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useR } from "@/r-machine/toolset";

export default function IntlDemo() {
  const r = useR("features/intl_demo");

  // Live clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Interactive counter for plural demo
  const [count, setCount] = useState(1);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{r.sectionTitle}</h2>
          <p className="text-lg text-muted-foreground">{r.sectionSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Date formatting */}
          <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-blue-500/5 via-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative space-y-4 pb-4">
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="text-xs font-medium px-3 py-1 shadow-sm">
                  {r.dateTime.badge}
                </Badge>
                <div className="size-10 rounded-full bg-linear-to-br from-blue-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-blue-500/40 transition-all duration-300">
                  <Calendar className="size-5 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold leading-tight">{r.dateTime.label}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <div className="text-2xl font-mono font-bold text-foreground mb-1.5">{r.dateTime.time(now)}</div>
              <div className="text-xs text-muted-foreground">{r.dateTime.caption(now)}</div>
            </CardContent>
          </Card>

          {/* Number & Currency formatting */}
          <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-emerald-500/5 via-emerald-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative space-y-4 pb-4">
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="text-xs font-medium px-3 py-1 shadow-sm">
                  {r.number.badge}
                </Badge>
                <div className="size-10 rounded-full bg-linear-to-br from-emerald-500/20 to-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-500/40 transition-all duration-300">
                  <Hash className="size-5 text-emerald-600" />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold leading-tight">{r.number.label}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <div className="text-lg leading-relaxed text-foreground">{r.number.description(1234.56)}</div>
            </CardContent>
          </Card>

          {/* Plural rules */}
          <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-violet-500/5 via-violet-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative space-y-4 pb-4">
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="text-xs font-medium px-3 py-1 shadow-sm">
                  {r.plural.badge}
                </Badge>
                <div className="size-10 rounded-full bg-linear-to-br from-violet-500/20 to-violet-500/20 flex items-center justify-center ring-1 ring-violet-500/40 transition-all duration-300">
                  <Users className="size-5 text-violet-600" />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold leading-tight">{r.plural.label}</CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-3">
              <div className="text-lg leading-relaxed text-foreground">
                <r.plural.Items count={count} />
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => setCount(Math.max(0, count - 1))}>
                  −
                </Button>
                <Button size="sm" variant="outline" onClick={() => setCount(count + 1)}>
                  +
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
