import React, { ReactNode } from "react";
import { useSwipeNavigation } from "@/hooks/use-swipe-navigation";
import { cn } from "@/lib/utils";

export interface SwipeableViewProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  enableHaptics?: boolean;
  className?: string;
}

export function SwipeableView({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.5,
  enableHaptics = true,
  className,
}: SwipeableViewProps) {
  const bind = useSwipeNavigation({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    velocityThreshold,
    enableHaptics,
  });

  return (
    <div
      {...bind()}
      className={cn("touch-pan-y", className)}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </div>
  );
}
