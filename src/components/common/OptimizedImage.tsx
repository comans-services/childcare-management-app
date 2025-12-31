import { useState, ImgHTMLAttributes } from "react";
import { useInView } from "@/hooks/use-intersection-observer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  skeletonClassName,
  ...props
}: OptimizedImageProps) {
  const { ref, isIntersecting } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {isIntersecting && !error ? (
        <>
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className={cn(
              "transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0",
              className
            )}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            {...props}
          />
          {!loaded && (
            <Skeleton
              className={cn("absolute inset-0", skeletonClassName)}
            />
          )}
        </>
      ) : error ? (
        <div className={cn("flex items-center justify-center bg-gray-100 text-gray-400", className)}>
          <span className="text-sm">Failed to load image</span>
        </div>
      ) : (
        <Skeleton className={cn(skeletonClassName || className)} />
      )}
    </div>
  );
}
