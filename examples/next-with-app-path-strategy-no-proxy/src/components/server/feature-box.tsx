import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { R_Features_Box_3 } from "@/r-machine/resources/features/box_3/en";

export default function FeatureBox({ feature }: { feature: R_Features_Box_3 }) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 border border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="absolute top-0 right-0 w-40 h-40 bg-linear-to-br from-primary/5 via-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="relative space-y-4 pb-4">
        <div className="flex items-start justify-between">
          <Badge variant="secondary" className="text-xs font-medium px-3 py-1 shadow-sm">
            {feature.badge}
          </Badge>
          <div className="size-10 rounded-full bg-linear-to-br from-stone-500/20 to-stone-500/20 group-hover:from-red-500/20 group-hover:to-red-500/20 flex items-center justify-center ring-1 ring-stone-500/20 group-hover:ring-red-500/40 transition-all duration-300">
            <Check className="size-5 text-stone-600 group-hover:text-red-600" />
          </div>
        </div>
        <CardTitle className="text-xl font-semibold leading-tight">{feature.title}</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <CardDescription className="text-base leading-relaxed text-muted-foreground/90">
          {feature.description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
