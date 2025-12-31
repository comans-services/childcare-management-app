import { useRef, useCallback } from "react";

/**
 * Throttle hook - limits how often a function can be called
 * Useful for scroll handlers, resize handlers, expensive operations
 *
 * @param callback - Function to throttle
 * @param delay - Minimum time between calls in milliseconds (default: 300ms)
 * @returns The throttled callback function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const lastRun = useRef(Date.now());
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      if (timeSinceLastRun >= delay) {
        // Enough time has passed, execute immediately
        callback(...args);
        lastRun.current = now;
      } else {
        // Not enough time has passed, schedule for later
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }

        timeoutId.current = setTimeout(() => {
          callback(...args);
          lastRun.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  );
}

/**
 * Throttle value hook - returns a throttled version of a value
 *
 * @param value - The value to throttle
 * @param delay - Minimum time between updates in milliseconds (default: 300ms)
 * @returns The throttled value
 */
export function useThrottledValue<T>(value: T, delay: number = 300): T {
  const throttledValue = useRef(value);
  const lastUpdate = useRef(Date.now());

  const now = Date.now();
  if (now - lastUpdate.current >= delay) {
    throttledValue.current = value;
    lastUpdate.current = now;
  }

  return throttledValue.current;
}
