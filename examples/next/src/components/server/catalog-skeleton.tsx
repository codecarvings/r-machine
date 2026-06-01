import { Skeleton } from "@/components/ui/skeleton";

// Suspense fallback shown while the async `inner/catalog` port resolves.
export default function CatalogSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-64 mb-3" />
      <Skeleton className="h-5 w-96 mb-8" />
      <div className="flex gap-2 mb-6">
        {["all", "peripherals", "displays", "audio"].map((k) => (
          <Skeleton key={k} className="h-8 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
          <Skeleton key={k} className="h-56" />
        ))}
      </div>
    </div>
  );
}
