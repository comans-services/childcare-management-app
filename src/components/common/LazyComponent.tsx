import { Suspense, ComponentType, ReactNode } from "react";
import { PageSkeleton, CompactPageSkeleton } from "./PageSkeleton";

export interface LazyComponentProps {
  component: ComponentType<any>;
  fallback?: ReactNode;
  compact?: boolean;
  [key: string]: any;
}

export function LazyComponent({
  component: Component,
  fallback,
  compact = false,
  ...props
}: LazyComponentProps) {
  // Use provided fallback, or default to PageSkeleton
  const defaultFallback = compact ? <CompactPageSkeleton /> : <PageSkeleton />;

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component {...props} />
    </Suspense>
  );
}
