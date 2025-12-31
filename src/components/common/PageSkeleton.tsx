import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="w-full h-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

export function CompactPageSkeleton() {
  return (
    <div className="w-full h-full p-4 space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
