
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const SkeletonLoadingState: React.FC = () => {
  return (
    <div className="space-y-4 w-full max-w-full">
      {/* Week navigation skeleton */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      
      {/* Week grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <div className="space-y-1">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      
      {/* Progress bar skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
};

export default SkeletonLoadingState;
