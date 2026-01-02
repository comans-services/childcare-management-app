import { useDrag } from "@use-gesture/react";
import { haptics } from "@/lib/haptics";

export interface UseSwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  enableHaptics?: boolean;
}

export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.5,
  enableHaptics = true,
}: UseSwipeNavigationOptions): (...args: unknown[]) => Record<string, unknown> {
  const bind = useDrag(
    ({ 
      movement: [mx, my], 
      velocity: [vx, vy], 
      direction: [dx, dy], 
      last 
    }) => {
      // Only process on drag end
      if (!last) return;

      // Check horizontal swipes (movement-based with velocity boost)
      const horizontalSwipe = Math.abs(mx) > threshold || 
                              (Math.abs(mx) > threshold / 2 && Math.abs(vx) > velocityThreshold);
      
      if (horizontalSwipe) {
        if (dx > 0 && onSwipeRight) {
          if (enableHaptics) haptics.selection();
          onSwipeRight();
          return;
        } else if (dx < 0 && onSwipeLeft) {
          if (enableHaptics) haptics.selection();
          onSwipeLeft();
          return;
        }
      }

      // Check vertical swipes
      const verticalSwipe = Math.abs(my) > threshold || 
                            (Math.abs(my) > threshold / 2 && Math.abs(vy) > velocityThreshold);
      
      if (verticalSwipe) {
        if (dy > 0 && onSwipeDown) {
          if (enableHaptics) haptics.selection();
          onSwipeDown();
        } else if (dy < 0 && onSwipeUp) {
          if (enableHaptics) haptics.selection();
          onSwipeUp();
        }
      }
    }
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return bind as any;
}
