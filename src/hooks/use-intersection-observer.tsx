import { useEffect, useRef, useState, RefObject } from "react";

export interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export interface UseIntersectionObserverReturn {
  ref: RefObject<HTMLDivElement>;
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  triggerOnce = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;

        setIsIntersecting(isElementIntersecting);
        setEntry(entry);

        // If triggerOnce is true and element is intersecting, disconnect observer
        if (triggerOnce && isElementIntersecting && element) {
          observer.unobserve(element);
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return {
    ref,
    isIntersecting,
    entry,
  };
}

// Convenience hook for lazy loading with common defaults
export function useInView(options?: UseIntersectionObserverOptions) {
  return useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
    ...options,
  });
}
