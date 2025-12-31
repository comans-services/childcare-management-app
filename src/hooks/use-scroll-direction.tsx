import { useState, useEffect } from "react";

export type ScrollDirection = 'up' | 'down' | null;

export interface UseScrollDirectionOptions {
  threshold?: number;
  initialDirection?: ScrollDirection;
}

export function useScrollDirection({
  threshold = 10,
  initialDirection = null,
}: UseScrollDirectionOptions = {}): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;

      // Only update if scrolled more than threshold
      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }

      // Determine direction
      const direction: ScrollDirection = scrollY > lastScrollY ? 'down' : 'up';

      setScrollDirection(direction);
      setLastScrollY(scrollY > 0 ? scrollY : 0);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [lastScrollY, threshold]);

  return scrollDirection;
}
