import { useGesture } from "@use-gesture/react";
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
}: UseSwipeNavigationOptions) {
  const bind = useGesture({
    onSwipe: ({ direction: [dx, dy], velocity: [vx, vy], event }) => {
      // Prevent default behavior if applicable
      event?.preventDefault();

      // Check horizontal swipes
      if (Math.abs(vx) > velocityThreshold || Math.abs(dx) > threshold) {
        if (dx > 0 && onSwipeRight) {
          // Swiped right
          if (enableHaptics) {
            haptics.selection();
          }
          onSwipeRight();
        } else if (dx < 0 && onSwipeLeft) {
          // Swiped left
          if (enableHaptics) {
            haptics.selection();
          }
          onSwipeLeft();
        }
      }

      // Check vertical swipes
      if (Math.abs(vy) > velocityThreshold || Math.abs(dy) > threshold) {
        if (dy > 0 && onSwipeDown) {
          // Swiped down
          if (enableHaptics) {
            haptics.selection();
          }
          onSwipeDown();
        } else if (dy < 0 && onSwipeUp) {
          // Swiped up
          if (enableHaptics) {
            haptics.selection();
          }
          onSwipeUp();
        }
      }
    },
  });

  return bind;
}
