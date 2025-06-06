
import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceConfig {
  enableLazyLoading?: boolean;
  enableResizeOptimization?: boolean;
  intersectionThreshold?: number;
  resizeDebounceMs?: number;
}

export const usePerformanceOptimization = (config: PerformanceConfig = {}) => {
  const {
    enableLazyLoading = true,
    enableResizeOptimization = true,
    intersectionThreshold = 0.1,
    resizeDebounceMs = 16, // ~60fps
  } = config;

  const [isVisible, setIsVisible] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const elementRef = useRef<HTMLElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading || !elementRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: intersectionThreshold,
        rootMargin: '50px',
      }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [enableLazyLoading, intersectionThreshold]);

  // Resize Observer for responsive behavior
  useEffect(() => {
    if (!enableResizeOptimization || !elementRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setDimensions({ width, height });
        }
      }, resizeDebounceMs);
    });

    resizeObserver.observe(elementRef.current);
    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [enableResizeOptimization, resizeDebounceMs]);

  const getOptimalGridColumns = useCallback((containerWidth: number, minCardWidth: number = 280) => {
    if (containerWidth < minCardWidth) return 1;
    return Math.floor(containerWidth / minCardWidth);
  }, []);

  const getOptimalImageSize = useCallback((containerWidth: number) => {
    if (containerWidth <= 320) return 320;
    if (containerWidth <= 640) return 640;
    if (containerWidth <= 768) return 768;
    if (containerWidth <= 1024) return 1024;
    if (containerWidth <= 1280) return 1280;
    return 1600;
  }, []);

  return {
    ref: elementRef,
    isVisible,
    dimensions,
    getOptimalGridColumns,
    getOptimalImageSize,
  };
};
