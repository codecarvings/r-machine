"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeatureBoxLoading() {
  return (
    <Card className="relative overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="relative space-y-4 pb-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>
        <Skeleton className="h-7 w-3/4" />
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </CardContent>
    </Card>
  );
}
